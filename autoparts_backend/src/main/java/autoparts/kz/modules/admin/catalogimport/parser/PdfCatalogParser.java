package autoparts.kz.modules.admin.catalogimport.parser;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.contentstream.PDFGraphicsStreamEngine;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImage;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.apache.pdfbox.util.Matrix;

import javax.imageio.ImageIO;
import java.awt.geom.Point2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Разбор PDF-каталога поставщика (формат Çeray: фото + таблица "Ürün Kodu | Ürün Açıklaması | Product Code |
 * Product Description"). Работает по текстовому слою и координатам: находит шапки таблиц, границы колонок
 * (по вертикальным линиям сетки, иначе по словам), строки товаров и растровые фото рядом с таблицей.
 * Страницы без текстового слоя только помечаются (OCR не делаем).
 * <p>
 * Не потокобезопасен: на каждый разбор — новый экземпляр.
 */
public class PdfCatalogParser {

    /** Сохраняет PNG картинки товара, возвращает ссылку (ключ S3 / путь). */
    public interface ImageSink {
        String store(byte[] png, int page, int index) throws IOException;
    }

    public interface Progress {
        void onPage(int done, int total);
    }

    /**
     * @param altCode артикул из английской половины таблицы, если в каталоге он отличается от турецкого (опечатка)
     */
    public record ParsedItem(int page, String section, String code, String altCode, String nameTr, String nameEn,
                             String note, String imageRef) {}

    public record ParsedCatalog(int pages, int pagesWithoutText, List<ParsedItem> items, List<String> warnings) {}

    private static final Pattern CODE = Pattern.compile("^\\d{3,}[0-9A-ZÇĞİÖŞÜ./-]*( [0-9A-ZÇĞİÖŞÜ./-]{1,8})*$");
    private static final Locale TR = Locale.forLanguageTag("tr");
    private static final float HEADER_BAND = 75f;      // логотипы в шапке страницы
    private static final float MIN_PHOTO_AREA = 1500f; // pt², мельче — значки (E-mark и т.п.)
    private static final int MAX_IMAGE_SIDE = 1200;

    private final List<String> warnings = new ArrayList<>();
    private int pageNo;

    public ParsedCatalog parse(byte[] pdf, ImageSink sink, Progress progress) throws IOException {
        List<ParsedItem> items = new ArrayList<>();
        warnings.clear();
        int noText = 0;
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            int total = doc.getNumberOfPages();
            PDFRenderer renderer = new PDFRenderer(doc);
            Map<Object, String> storedImages = new HashMap<>();
            String section = null;
            for (int p = 0; p < total; p++) {
                pageNo = p + 1;
                PDPage page = doc.getPage(p);
                PageText text = extractText(doc, p + 1);
                if (text.glyphCount < 20) {
                    noText++;
                    warnings.add("Стр. " + pageNo + ": нет текстового слоя, пропущена");
                    if (progress != null) progress.onPage(p + 1, total);
                    continue;
                }
                if (text.section != null) section = text.section;

                PageGraphics gfx = new PageGraphics(page);
                gfx.processPage(page);
                List<Table> tables = findTables(text.lines, gfx, page.getCropBox().getWidth());
                Map<Table, List<PlacedImage>> photosByTable = assignImages(tables, gfx.images);

                int imgIndex = 0;
                for (Table t : tables) {
                    List<Row> rows = t.rowList();
                    if (rows.isEmpty()) continue;
                    List<PlacedImage> photos = photosByTable.getOrDefault(t, List.of());
                    PlacedImage[] chosen = choosePhotos(rows, photos);
                    String fallback = null;
                    if (photos.isEmpty()) {
                        // растра нет (вектор) — рендерим область над таблицей до предыдущей таблицы
                        float top = HEADER_BAND;
                        for (Table o : tables) if (o != t && o.bottom <= t.top && overlapsX(o, t)) top = Math.max(top, o.bottom);
                        if (t.top - top > 40) {
                            BufferedImage crop = renderRegion(renderer, p, t.x0, top, t.x1, t.top);
                            if (crop != null) fallback = sink.store(toPng(crop), p + 1, imgIndex++);
                        }
                        if (fallback == null) warnings.add("Стр. " + pageNo + ": нет фото для " + rows.get(0).code);
                    }
                    String note = t.note.isEmpty() ? null : clean(t.note.toString());
                    for (int r = 0; r < rows.size(); r++) {
                        Row row = rows.get(r);
                        String ref = fallback;
                        PlacedImage img = chosen[r];
                        if (img != null) {
                            ref = storedImages.get(img.key);
                            if (ref == null) {
                                ref = sink.store(toPng(img.image), p + 1, imgIndex++);
                                storedImages.put(img.key, ref);
                            }
                        }
                        items.add(new ParsedItem(p + 1, section, row.code, row.altCode, clean(row.tr), clean(row.en),
                                note, ref));
                    }
                }
                if (progress != null) progress.onPage(p + 1, total);
            }
            return new ParsedCatalog(total, noText, items, List.copyOf(warnings));
        }
    }

    // ---------------------------------------------------------------- images → tables

    private static boolean overlapsX(Table a, Table b) {
        return Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 10;
    }

    /**
     * Каждое фото — таблице, к которой оно относится: сначала таблица сбоку (центр фото по высоте внутри таблицы),
     * затем ближайшая таблица ниже, перекрывающаяся по горизонтали, затем просто ближайшая ниже.
     */
    private static Map<Table, List<PlacedImage>> assignImages(List<Table> tables, List<PlacedImage> images) {
        Map<Table, List<PlacedImage>> res = new HashMap<>();
        for (PlacedImage img : images) {
            float cx = img.x + img.w / 2, cy = img.y + img.h / 2;
            Table best = null;
            for (Table t : tables) {
                boolean beside = cy >= t.top && cy <= t.bottom && (cx < t.x0 || cx > t.x1);
                if (beside && (best == null || Math.abs(t.x0 - cx) < Math.abs(best.x0 - cx))) best = t;
            }
            if (best == null) best = nearestBelow(tables, cx, cy, true);
            if (best == null) best = nearestBelow(tables, cx, cy, false);
            if (best != null) res.computeIfAbsent(best, k -> new ArrayList<>()).add(img);
        }
        return res;
    }

    private static Table nearestBelow(List<Table> tables, float cx, float cy, boolean requireOverlap) {
        Table best = null;
        for (Table t : tables) {
            if (t.top < cy || t.rows.isEmpty()) continue;
            if (requireOverlap && (cx < t.x0 - 20 || cx > t.x1 + 20)) continue;
            if (best == null || t.top < best.top) best = t;
        }
        return best;
    }

    /**
     * Фото для строк таблицы: таблицы рядом (две группы колонок с разными товарами) — фото над своей колонкой;
     * число фото = числу строк — по порядку слева направо; иначе самое крупное фото на все строки.
     */
    private static PlacedImage[] choosePhotos(List<Row> rows, List<PlacedImage> photos) {
        PlacedImage[] res = new PlacedImage[rows.size()];
        if (photos.isEmpty()) return res;
        Comparator<PlacedImage> bySize = Comparator.comparingDouble((PlacedImage i) -> -i.w * i.h);
        PlacedImage largest = photos.stream().min(bySize).orElseThrow();
        boolean sideBySide = rows.stream().map(r -> Math.round(r.x0)).distinct().count() > 1;
        if (sideBySide) {
            for (int r = 0; r < rows.size(); r++) {
                Row row = rows.get(r);
                res[r] = photos.stream().filter(i -> i.x + i.w / 2 >= row.x0 && i.x + i.w / 2 < row.x1)
                        .min(bySize).orElse(largest);
            }
        } else if (photos.size() > 1 && photos.size() == rows.size()) {
            List<PlacedImage> sorted = new ArrayList<>(photos);
            sorted.sort(Comparator.comparingDouble(i -> i.x));
            for (int r = 0; r < rows.size(); r++) res[r] = sorted.get(r);
        } else {
            Arrays.fill(res, largest);
        }
        return res;
    }

    // ---------------------------------------------------------------- text

    private static final class Glyph {
        final float x, y, w, h, space;
        final String s;

        Glyph(TextPosition tp) {
            x = tp.getXDirAdj();
            y = tp.getYDirAdj();
            w = tp.getWidthDirAdj();
            h = tp.getHeightDir();
            // межсловный промежуток ~0.25 кегля, кернинг обычно < 0.1
            space = Math.max(tp.getFontSizeInPt(), tp.getHeightDir()) * 0.17f;
            s = tp.getUnicode();
        }
    }

    static final class Line {
        final List<Glyph> glyphs = new ArrayList<>();
        float y, h;

        String text(float from, float to) {
            StringBuilder sb = new StringBuilder();
            Glyph prev = null;
            for (Glyph g : glyphs) {
                float cx = g.x + g.w / 2;
                if (cx < from || cx >= to) continue;
                if (prev != null && g.x - (prev.x + prev.w) > prev.space) sb.append(' ');
                sb.append(g.s);
                prev = g;
            }
            return sb.toString().replaceAll("\\s+", " ").trim();
        }

        String text() { return text(-1e6f, 1e6f); }

        /** x начала каждого слова в диапазоне. */
        List<Float> wordStarts(float from, float to) {
            List<Float> res = new ArrayList<>();
            Glyph prev = null;
            for (Glyph g : glyphs) {
                float cx = g.x + g.w / 2;
                if (cx < from || cx >= to) continue;
                if (prev == null || g.x - (prev.x + prev.w) > prev.space) res.add(g.x);
                prev = g;
            }
            return res;
        }

        float maxX(float from) {
            float m = from;
            for (Glyph g : glyphs) if (g.x >= from) m = Math.max(m, g.x + g.w);
            return m;
        }
    }

    private static final class PageText {
        List<Line> lines = new ArrayList<>();
        String section;
        int glyphCount;
    }

    private PageText extractText(PDDocument doc, int page) throws IOException {
        List<TextPosition> horizontal = new ArrayList<>();
        List<TextPosition> rotated = new ArrayList<>();
        PDFTextStripper stripper = new PDFTextStripper() {
            @Override
            protected void writeString(String string, List<TextPosition> positions) {
                for (TextPosition tp : positions) {
                    if (tp.getDir() == 0) horizontal.add(tp); else rotated.add(tp);
                }
            }
        };
        stripper.setStartPage(page);
        stripper.setEndPage(page);
        stripper.getText(doc);

        PageText res = new PageText();
        res.glyphCount = horizontal.size() + rotated.size();
        res.lines = groupLines(horizontal);
        res.section = sectionFrom(groupLines(rotated));
        return res;
    }

    private static List<Line> groupLines(List<TextPosition> positions) {
        List<Glyph> glyphs = new ArrayList<>();
        // пробелы не берём: CorelDRAW ставит их поверх соседних букв ("Y AN"), слова режем по промежуткам
        for (TextPosition tp : positions) if (!tp.getUnicode().isBlank()) glyphs.add(new Glyph(tp));
        glyphs.sort(Comparator.comparingDouble((Glyph g) -> g.y).thenComparingDouble(g -> g.x));
        List<Line> lines = new ArrayList<>();
        Line cur = null;
        for (Glyph g : glyphs) {
            if (cur == null || Math.abs(g.y - cur.y) > Math.max(1.5f, cur.h * 0.35f)) {
                cur = new Line();
                cur.y = g.y;
                cur.h = g.h;
                lines.add(cur);
            }
            cur.glyphs.add(g);
            cur.h = Math.max(cur.h, g.h);
        }
        for (Line l : lines) l.glyphs.sort(Comparator.comparingDouble(g -> g.x));
        return lines;
    }

    private static String sectionFrom(List<Line> rotatedLines) {
        String best = null;
        for (Line l : rotatedLines) {
            String t = l.text();
            if (t.length() >= 6 && t.chars().filter(Character::isLetter).count() > 4
                    && (best == null || t.length() > best.length())) {
                best = t;
            }
        }
        return best == null ? null : clean(best);
    }

    // ---------------------------------------------------------------- tables

    private static final class Row {
        final String code;
        String altCode;
        String tr = "";
        String en = "";
        float x0, x1; // группа колонок, где найден артикул

        Row(String code) { this.code = code; }
    }

    static final class Table {
        float top, bottom, x0, x1;
        int headerLine;
        final LinkedHashMap<String, Row> rows = new LinkedHashMap<>();
        final StringBuilder note = new StringBuilder();
        boolean hasTr, hasEn;

        List<Row> rowList() { return new ArrayList<>(rows.values()); }
    }

    /** Группа колонок шапки: "артикул | описание" на одном языке. */
    private record Group(boolean en, float codeX, float descX, float endX) {}

    private record Label(float x, boolean en, boolean code) {}

    private static final String[][] LABELS = {
            {"ürünkodu", "TR_CODE"}, {"ürünaçıklaması", "TR_DESC"},
            {"productcode", "EN_CODE"}, {"productdescription", "EN_DESC"}};

    private static List<Label> labels(Line line, float from, float to) {
        List<Label> res = new ArrayList<>();
        for (String[] l : LABELS) {
            for (float x : labelXs(line, l[0])) {
                if (x >= from && x < to) res.add(new Label(x, l[1].startsWith("EN"), l[1].endsWith("CODE")));
            }
        }
        res.sort(Comparator.comparingDouble(Label::x));
        return res;
    }

    private static boolean hasCodeLabel(Line line, float from, float to) {
        return labels(line, from, to).stream().anyMatch(Label::code);
    }

    private List<Table> findTables(List<Line> lines, PageGraphics gfx, float pageWidth) {
        // 1. шапки. В одной строке может быть несколько таблиц рядом (их разделяет рамка), а слева от шапки —
        //    строка соседней таблицы, поэтому таблица = от подписи "артикул" до правого края её рамки.
        List<Table> tables = new ArrayList<>();
        for (int i = 0; i < lines.size(); i++) {
            Line l = lines.get(i);
            List<Label> ls = labels(l, -1e6f, 1e6f);
            int pos = 0;
            while (pos < ls.size()) {
                int k = pos;
                while (k < ls.size() && !ls.get(k).code()) k++;
                if (k >= ls.size()) break;
                Label first = ls.get(k);
                Table t = new Table();
                t.headerLine = i;
                t.top = l.y - l.h;
                t.x0 = first.x() - 3;
                t.x1 = frameRight(gfx.horizontals, l, first.x(), pageWidth);
                tables.add(t);
                pos = k + 1;
                while (pos < ls.size() && ls.get(pos).x() < t.x1) pos++;
            }
        }
        // 2. соседняя справа таблица примерно на той же высоте ограничивает таблицу
        for (Table a : tables) {
            for (Table b : tables) {
                if (b != a && b.x0 > a.x0 + 20 && Math.abs(b.top - a.top) < 60 && b.x0 < a.x1) a.x1 = b.x0 - 1;
            }
        }
        // 3. строки
        for (Table t : tables) parseRows(t, lines, gfx.verticals);
        tables.addAll(headerlessTables(lines, tables));
        tables.sort(Comparator.comparingDouble((Table t) -> t.top).thenComparingDouble(t -> t.x0));
        return mergeStackedTables(tables);
    }

    /** Правый край рамки шапки: самая длинная горизонтальная линия у верха/низа шапки, начинающаяся у подписи. */
    private static float frameRight(List<float[]> horizontals, Line header, float labelX, float pageWidth) {
        float best = Float.NaN;
        for (float[] h : horizontals) { // y, xLeft, xRight
            boolean nearY = h[0] >= header.y - header.h - 5 && h[0] <= header.y + 5;
            if (nearY && h[1] <= labelX + 2 && h[1] >= labelX - 15 && h[2] > labelX + 40) {
                best = Float.isNaN(best) ? h[2] : Math.max(best, h[2]);
            }
        }
        return Float.isNaN(best) ? pageWidth : best + 1;
    }

    private static final Pattern VARIANT = Pattern.compile("(LH|RH|SOL|SAĞ|\\d{1,2}(/\\d{1,2})?V)"); // без шапки "LED" — уже слово описания
    private static final Pattern TURKISH = Pattern.compile("[ÇĞİÖŞÜçğıöşü]|LAMBA|FAR[IA]?\\b|CAM[I]?\\b");

    /**
     * Таблицы без шапки (строки "артикул | описание", турецкая и английская строка с одним артикулом подряд):
     * берём не попавшие в таблицы куски строк, которые начинаются с артикула.
     */
    private List<Table> headerlessTables(List<Line> lines, List<Table> tables) {
        List<Table> res = new ArrayList<>();
        for (Line l : lines) {
            for (float[] seg : segments(l)) {
                float cy = l.y - l.h / 2;
                boolean covered = false;
                for (Table t : tables) {
                    if (cy >= t.top - 2 && cy <= t.bottom + 2 && seg[0] >= t.x0 - 5 && seg[0] < t.x1) { covered = true; break; }
                }
                if (covered) continue;
                String[] tokens = l.text(seg[0], seg[1]).split(" ");
                if (tokens.length < 3 || !tokens[0].matches("\\d{5,}[0-9A-ZÇĞİÖŞÜ./-]*")) continue;
                int n = 1;
                while (n < tokens.length - 1 && VARIANT.matcher(tokens[n]).matches()) n++;
                String code = normCode(String.join(" ", Arrays.copyOfRange(tokens, 0, n)));
                String desc = String.join(" ", Arrays.copyOfRange(tokens, n, tokens.length));
                if (desc.chars().filter(Character::isLetter).count() < 4) continue;

                Table t = null;
                for (Table c : res) {
                    if (Math.abs(c.x0 - seg[0]) < 15 && l.y - c.bottom < l.h * 3 && l.y > c.top) { t = c; break; }
                }
                if (t == null) {
                    t = new Table();
                    t.headerLine = -1;
                    t.top = l.y - l.h;
                    t.x0 = seg[0] - 1;
                    t.x1 = seg[1] + 1;
                    res.add(t);
                }
                t.bottom = l.y + 2;
                t.x1 = Math.max(t.x1, seg[1] + 1);
                Row r = t.rows.get(code);
                boolean en = r != null ? !r.tr.isEmpty() : !TURKISH.matcher(desc).find();
                if (r == null) {
                    r = new Row(code);
                    r.x0 = t.x0;
                    r.x1 = t.x1;
                    t.rows.put(code, r);
                }
                if (en) { r.en = desc; t.hasEn = true; } else { r.tr = desc; t.hasTr = true; }
            }
        }
        if (!res.isEmpty()) warnings.add("Стр. " + pageNo + ": таблицы без шапки — " + res.stream()
                .mapToInt(t -> t.rows.size()).sum() + " строк, проверьте");
        return res;
    }

    /**
     * Куски строки, разделённые большим промежутком (> 14pt); новый кусок начинается только с числа
     * (артикула), иначе это колонка описания того же куска.
     */
    private static List<float[]> segments(Line l) {
        List<float[]> res = new ArrayList<>();
        Glyph prev = null;
        float start = 0;
        for (int i = 0; i < l.glyphs.size(); i++) {
            Glyph g = l.glyphs.get(i);
            if (prev == null) start = g.x;
            else if (g.x - (prev.x + prev.w) > 14 && startsNumber(l.glyphs, i)) {
                res.add(new float[]{start, prev.x + prev.w});
                start = g.x;
            }
            prev = g;
        }
        if (prev != null) res.add(new float[]{start, prev.x + prev.w});
        return res;
    }

    private static boolean startsNumber(List<Glyph> glyphs, int i) {
        int digits = 0;
        for (int k = i; k < glyphs.size() && Character.isDigit(glyphs.get(k).s.charAt(0)); k++) digits++;
        return digits >= 5;
    }

    private void parseRows(Table t, List<Line> lines, List<float[]> verticals) {
        Line header = lines.get(t.headerLine);
        List<Group> groups = groups(header, t, lines, verticals);
        for (Group g : groups) {
            if (g.en) t.hasEn = true; else t.hasTr = true;
        }
        long trGroups = groups.stream().filter(g -> !g.en).count();
        long enGroups = groups.size() - trGroups;

        float lastY = header.y, lineH = Math.max(header.h, 5f);
        Row[] lastRow = new Row[groups.size()];
        for (int j = t.headerLine + 1; j < lines.size(); j++) {
            Line l = lines.get(j);
            String lt = l.text(t.x0, t.x1);
            if (lt.isEmpty()) {
                if (l.y - lastY > lineH * 2.6f) break;
                continue;
            }
            if (l.y - lastY > lineH * 2.6f || hasCodeLabel(l, t.x0, t.x1) || lt.startsWith("•")) break;
            lastY = l.y;

            String[] codes = new String[groups.size()], descs = new String[groups.size()];
            for (int gi = 0; gi < groups.size(); gi++) {
                Group g = groups.get(gi);
                codes[gi] = normCode(l.text(g.codeX, g.descX));
                descs[gi] = l.text(g.descX, g.endX);
            }
            // одна строка "TR | EN", а артикулы в половинах разные — опечатка каталога, это один товар
            String altCode = null;
            if (trGroups == 1 && enGroups == 1) {
                int tri = groups.get(0).en ? 1 : 0, eni = 1 - tri;
                if (isCode(codes[tri]) && isCode(codes[eni]) && !codes[tri].equals(codes[eni])) {
                    warnings.add("Стр. " + pageNo + ": артикул TR " + codes[tri] + " ≠ EN " + codes[eni]
                            + " — взят TR");
                    altCode = codes[eni];
                    codes[eni] = codes[tri];
                }
            }
            boolean noteLine = false;
            for (int gi = 0; gi < groups.size(); gi++) {
                Group g = groups.get(gi);
                String code = codes[gi], desc = descs[gi];
                if (isCode(code)) {
                    Row r = t.rows.get(code);
                    if (r == null) {
                        r = new Row(code);
                        r.x0 = g.codeX;
                        r.x1 = g.endX;
                        t.rows.put(code, r);
                    }
                    if (g.en && altCode != null) r.altCode = altCode;
                    if (g.en) r.en = desc; else r.tr = desc;
                    lastRow[gi] = r;
                } else if (code.isEmpty() && lastRow[gi] != null) {
                    if (desc.isEmpty()) continue;
                    Row r = lastRow[gi];
                    if (g.en) r.en = (r.en + " " + desc).trim(); else r.tr = (r.tr + " " + desc).trim();
                } else if (!code.isEmpty() || !desc.isEmpty()) {
                    noteLine = true;
                }
            }
            if (noteLine) {
                if (t.note.length() > 0) t.note.append(' ');
                t.note.append(lt);
            }
        }
        t.bottom = lastY + 2;
    }

    private static boolean isCode(String s) {
        return !s.isEmpty() && CODE.matcher(s).matches();
    }

    /**
     * Турецкая и английская таблицы одного блока стоят рядом (две рамки в строку) или друг под другом:
     * сливаем по артикулу, а если артикулы расходятся (опечатка каталога) — по порядку строк.
     */
    private List<Table> mergeStackedTables(List<Table> tables) {
        List<Table> res = new ArrayList<>();
        for (Table t : tables) {
            Table prev = null;
            for (int k = res.size() - 1; k >= 0 && prev == null; k--) {
                Table c = res.get(k);
                if (c.hasTr == t.hasTr && c.hasEn == t.hasEn) continue;
                boolean side = Math.abs(c.top - t.top) < 6 && c.x1 <= t.x0 + 5;
                boolean stacked = Math.abs(c.x0 - t.x0) < 15 && t.top - c.bottom < 40 && t.top >= c.bottom - 8;
                if (side || stacked) prev = c;
            }
            if (prev != null && prev.rows.keySet().containsAll(t.rows.keySet())) {
                for (Row r : t.rows.values()) fillMissing(prev.rows.get(r.code), r);
            } else if (prev != null && prev.rows.size() == t.rows.size()) {
                List<Row> a = prev.rowList(), b = t.rowList();
                for (int k = 0; k < a.size(); k++) {
                    if (!a.get(k).code.equals(b.get(k).code)) {
                        warnings.add("Стр. " + pageNo + ": артикул " + a.get(k).code + " ≠ " + b.get(k).code
                                + " в парной таблице — взят " + (prev.hasTr ? "TR" : "первый"));
                        a.get(k).altCode = b.get(k).code;
                    }
                    fillMissing(a.get(k), b.get(k));
                }
            } else {
                res.add(t);
                continue;
            }
            if (t.note.length() > 0) prev.note.append(' ').append(t.note);
            prev.bottom = Math.max(prev.bottom, t.bottom);
            prev.x1 = Math.max(prev.x1, t.x1);
            prev.hasEn |= t.hasEn;
            prev.hasTr |= t.hasTr;
        }
        return res;
    }

    private static void fillMissing(Row target, Row src) {
        if (target.tr.isEmpty()) target.tr = src.tr;
        if (target.en.isEmpty()) target.en = src.en;
    }

    private List<Group> groups(Line header, Table t, List<Line> lines, List<float[]> verticals) {
        List<Label> ls = labels(header, t.x0, t.x1);
        List<Label> codes = ls.stream().filter(Label::code).toList();

        // вертикальные линии сетки, пересекающие шапку
        List<Float> xs = new ArrayList<>();
        float hy0 = header.y - header.h - 1, hy1 = header.y + 3;
        for (float[] v : verticals) {
            if (v[1] <= hy1 && v[2] >= hy0 && v[0] >= t.x0 - 12 && v[0] <= t.x1 + 1) xs.add(v[0]);
        }
        xs = cluster(xs);

        List<Group> res = new ArrayList<>();
        for (int k = 0; k < codes.size(); k++) {
            float codeLabel = codes.get(k).x();
            float nextCode = k + 1 < codes.size() ? codes.get(k + 1).x() : t.x1;
            float codeX = lineBefore(xs, codeLabel, codeLabel - 3);
            float endX = k + 1 < codes.size() ? lineBefore(xs, nextCode, nextCode - 3) : t.x1;
            Float descLabel = null;
            for (Label d : ls) if (!d.code() && d.x() > codeLabel && d.x() < nextCode) { descLabel = d.x(); break; }
            float descX = Float.NaN;
            for (float x : xs) {
                if (x > codeLabel + 10 && (descLabel == null || x < descLabel)) { descX = x; break; }
            }
            if (Float.isNaN(descX)) descX = wordBoundary(lines, t.headerLine, codeX, endX);
            res.add(new Group(codes.get(k).en(), codeX, descX, endX));
        }
        return res;
    }

    private static float lineBefore(List<Float> xs, float labelX, float fallback) {
        float best = Float.NaN;
        for (float x : xs) if (x <= labelX + 1 && x > labelX - 12) best = x;
        return Float.isNaN(best) ? fallback : best - 0.5f;
    }

    /**
     * Сетки нет: граница "артикул | описание" — минимальная позиция первого слова после артикула
     * (артикул = первый токен + короткие вариантные токены LH, 24V, ...).
     */
    private static float wordBoundary(List<Line> lines, int headerIdx, float codeX, float limit) {
        Line header = lines.get(headerIdx);
        float best = Float.NaN;
        for (int j = headerIdx + 1; j < lines.size() && j < headerIdx + 12; j++) {
            Line l = lines.get(j);
            if (l.y - header.y > 120 || hasCodeLabel(l, codeX, limit)) break;
            String[] tokens = l.text(codeX, limit).split(" ");
            if (tokens.length < 2 || tokens[0].isEmpty() || !Character.isDigit(tokens[0].charAt(0))) continue;
            int n = 1;
            while (n < tokens.length && tokens[n].matches("(LH|RH|SOL|SAĞ|\\d{1,2}(/\\d{1,2})?V|[A-Z]{1,3})")) n++;
            List<Float> starts = l.wordStarts(codeX, limit);
            if (starts.size() > n) {
                float x = starts.get(n) - 0.5f;
                best = Float.isNaN(best) ? x : Math.min(best, x);
            }
        }
        return Float.isNaN(best) ? codeX + 60 : best;
    }

    private static List<Float> labelXs(Line line, String target) {
        StringBuilder sb = new StringBuilder();
        List<Float> starts = new ArrayList<>();
        for (Glyph g : line.glyphs) {
            String s = g.s.toLowerCase(TR);
            for (int c = 0; c < s.length(); c++) starts.add(g.x);
            sb.append(s);
        }
        List<Float> res = new ArrayList<>();
        for (int idx = sb.indexOf(target); idx >= 0; idx = sb.indexOf(target, idx + 1)) res.add(starts.get(idx));
        return res;
    }

    private static List<Float> cluster(List<Float> xs) {
        Collections.sort(xs);
        List<Float> res = new ArrayList<>();
        for (float x : xs) {
            if (res.isEmpty() || x - res.get(res.size() - 1) > 2f) res.add(x);
        }
        return res;
    }

    static String normCode(String s) {
        return s.toUpperCase(TR).replaceAll("\\s+", " ").trim();
    }

    static String clean(String s) {
        if (s == null) return null;
        String t = s.replaceAll("\\s+", " ").trim();
        return t.isEmpty() ? null : t;
    }

    // ---------------------------------------------------------------- graphics

    private record PlacedImage(Object key, BufferedImage image, float x, float y, float w, float h) {}

    /** Собирает растровые картинки и вертикальные линии страницы (координаты: от верха страницы). */
    private static final class PageGraphics extends PDFGraphicsStreamEngine {
        final List<PlacedImage> images = new ArrayList<>();
        final List<float[]> verticals = new ArrayList<>(); // x, yTop, yBottom
        final List<float[]> horizontals = new ArrayList<>(); // y, xLeft, xRight
        private final float pageH, pageW, offX, offY;
        private final List<Point2D[]> segments = new ArrayList<>();
        private Point2D current, subpathStart;

        PageGraphics(PDPage page) {
            super(page);
            PDRectangle box = page.getCropBox();
            pageH = box.getHeight();
            pageW = box.getWidth();
            offX = box.getLowerLeftX();
            offY = box.getLowerLeftY();
        }

        @Override
        public void drawImage(PDImage pdImage) throws IOException {
            Matrix m = getGraphicsState().getCurrentTransformationMatrix();
            float w = Math.abs(m.getScalingFactorX()), h = Math.abs(m.getScalingFactorY());
            float x = m.getTranslateX() - offX;
            float yBottom = m.getTranslateY() - offY;
            if (m.getScaleY() < 0) yBottom -= h;
            float yTop = pageH - yBottom - h;
            if (w * h < MIN_PHOTO_AREA || w * h > pageW * pageH * 0.5f) return;
            if (yTop + h / 2 < HEADER_BAND) return;
            Object key = pdImage instanceof PDImageXObject xo ? xo.getCOSObject() : pdImage;
            BufferedImage img = pdImage.getImage(); // для PDImageXObject — уже с SMask (прозрачность)
            if (img == null) return;
            images.add(new PlacedImage(key, img, x, yTop, w, h));
        }

        @Override
        public void appendRectangle(Point2D p0, Point2D p1, Point2D p2, Point2D p3) {
            segments.add(new Point2D[]{p0, p1});
            segments.add(new Point2D[]{p1, p2});
            segments.add(new Point2D[]{p2, p3});
            segments.add(new Point2D[]{p3, p0});
        }

        @Override
        public void moveTo(float x, float y) {
            current = new Point2D.Float(x, y);
            subpathStart = current;
        }

        @Override
        public void lineTo(float x, float y) {
            Point2D p = new Point2D.Float(x, y);
            if (current != null) segments.add(new Point2D[]{current, p});
            current = p;
        }

        @Override public void curveTo(float x1, float y1, float x2, float y2, float x3, float y3) { current = new Point2D.Float(x3, y3); }
        @Override public Point2D getCurrentPoint() { return current; }
        @Override public void closePath() { if (subpathStart != null && current != null) segments.add(new Point2D[]{current, subpathStart}); }
        @Override public void endPath() { segments.clear(); }
        @Override public void strokePath() { flush(); }
        @Override public void fillPath(int windingRule) { flush(); }
        @Override public void fillAndStrokePath(int windingRule) { flush(); }
        @Override public void clip(int windingRule) { }
        @Override public void shadingFill(COSName shadingName) { }

        private void flush() {
            for (Point2D[] s : segments) {
                double dx = Math.abs(s[0].getX() - s[1].getX());
                double dy = Math.abs(s[0].getY() - s[1].getY());
                if (dx < 0.8 && dy > 4) {
                    float x = (float) ((s[0].getX() + s[1].getX()) / 2) - offX;
                    float y0 = pageH - (float) Math.max(s[0].getY(), s[1].getY()) + offY;
                    float y1 = pageH - (float) Math.min(s[0].getY(), s[1].getY()) + offY;
                    verticals.add(new float[]{x, y0, y1});
                } else if (dy < 0.8 && dx > 20) {
                    float y = pageH - (float) ((s[0].getY() + s[1].getY()) / 2) + offY;
                    float xa = (float) Math.min(s[0].getX(), s[1].getX()) - offX;
                    float xb = (float) Math.max(s[0].getX(), s[1].getX()) - offX;
                    horizontals.add(new float[]{y, xa, xb});
                }
            }
            segments.clear();
        }
    }

    private static BufferedImage renderRegion(PDFRenderer renderer, int pageIndex,
                                              float left, float top, float right, float bottom) {
        try {
            float scale = 150f / 72f;
            BufferedImage full = renderer.renderImageWithDPI(pageIndex, 150, ImageType.RGB);
            int x0 = Math.max(0, (int) (left * scale)), x1 = Math.min(full.getWidth(), (int) (right * scale));
            int y0 = Math.max(0, (int) (top * scale)), y1 = Math.min(full.getHeight(), (int) (bottom * scale));
            if (y1 - y0 < 20 || x1 - x0 < 20) return null;
            return full.getSubimage(x0, y0, x1 - x0, y1 - y0);
        } catch (IOException e) {
            return null;
        }
    }

    static byte[] toPng(BufferedImage img) throws IOException {
        int side = Math.max(img.getWidth(), img.getHeight());
        if (side > MAX_IMAGE_SIDE) {
            double k = (double) MAX_IMAGE_SIDE / side;
            int w = (int) Math.round(img.getWidth() * k), h = (int) Math.round(img.getHeight() * k);
            BufferedImage scaled = new BufferedImage(w, h, img.getColorModel().hasAlpha()
                    ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
            var g = scaled.createGraphics();
            g.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION, java.awt.RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(img, 0, 0, w, h, null);
            g.dispose();
            img = scaled;
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }
}

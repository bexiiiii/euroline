package autoparts.kz.modules.admin.catalogimport;

import autoparts.kz.modules.admin.catalogimport.parser.PdfCatalogParser;
import autoparts.kz.modules.admin.catalogimport.parser.PdfCatalogParser.ParsedItem;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.util.Matrix;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class PdfCatalogParserTest {

    private static final PDType1Font FONT = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final float H = PDRectangle.A4.getHeight();

    /** Сохраняет картинки в память, ссылка = "img<N>" (по порядку). */
    private static final class MemorySink implements PdfCatalogParser.ImageSink {
        final List<byte[]> images = new ArrayList<>();

        @Override
        public String store(byte[] png, int page, int index) {
            images.add(png);
            return "img" + (images.size() - 1);
        }
    }

    @Test
    void parsesGridTableWithPhotoAbove() throws IOException {
        byte[] pdf = pdf(cs -> {
            image(cs, Color.RED, 60, 120, 200, 120);   // фото товара над таблицей (top=120)
            tableTrEn(cs, 260, 40, new String[][]{
                    {"202501-12V", "DINAMIK KARE STOP LAMBASI 12V", "SQUARE NEON LED REAR COMB. LAMP"},
                    {"202501-24V", "DINAMIK KARE STOP LAMBASI 24V", "SQUARE NEON LED REAR COMB. LAMP"}});
            image(cs, Color.BLUE, 60, 400, 150, 100);
            tableTrEn(cs, 520, 40, new String[][]{{"712211-LH", "TRAKTOR STOP LAMBASI SOL", "TRACTOR REAR COMBINATION LAMP LEFT"}});
        });
        MemorySink sink = new MemorySink();
        var res = new PdfCatalogParser().parse(pdf, sink, null);

        assertEquals(List.of("202501-12V", "202501-24V", "712211-LH"), codes(res.items()));
        ParsedItem first = res.items().get(0);
        assertEquals("DINAMIK KARE STOP LAMBASI 12V", first.nameTr());
        assertEquals("SQUARE NEON LED REAR COMB. LAMP", first.nameEn());
        assertEquals("img0", first.imageRef(), "варианты одной таблицы делят фото над ней");
        assertEquals("img0", res.items().get(1).imageRef());
        assertEquals("img1", res.items().get(2).imageRef());
        assertEquals(2, sink.images.size());
        assertTrue(new String(sink.images.get(0), 1, 3).equals("PNG"));
    }

    @Test
    void typoInEnglishCodeKeepsTurkishCodeAndWarns() throws IOException {
        byte[] pdf = pdf(cs -> {
            image(cs, Color.GREEN, 60, 120, 200, 120);
            tableTrEn(cs, 260, 40, new String[][]{{"2112127-K", "DEFENDER STOP LAMBASI", "DEFENDER REAR LAMP RED"}},
                    new String[]{"2112126-K"});
        });
        var res = new PdfCatalogParser().parse(pdf, new MemorySink(), null);
        assertEquals(1, res.items().size());
        assertEquals("2112127-K", res.items().get(0).code());
        assertEquals("2112126-K", res.items().get(0).altCode());
        assertEquals("DEFENDER REAR LAMP RED", res.items().get(0).nameEn());
        assertTrue(res.warnings().stream().anyMatch(w -> w.contains("2112126-K")));
    }

    @Test
    void pageWithoutTextIsReportedNotParsed() throws IOException {
        byte[] pdf = pdf(cs -> image(cs, Color.GRAY, 60, 120, 300, 300));
        var res = new PdfCatalogParser().parse(pdf, new MemorySink(), null);
        assertEquals(1, res.pagesWithoutText());
        assertTrue(res.items().isEmpty());
    }

    /**
     * Прогон на настоящих каталогах: -Dcatalog.pdf.dir=/path/to/pdfs (иначе пропускается).
     * Печатает счётчики и примеры — это dry-run без записи в базу.
     */
    @Test
    @EnabledIfSystemProperty(named = "catalog.pdf.dir", matches = ".+")
    void dryRunRealCatalogs() throws IOException {
        Path dir = Path.of(System.getProperty("catalog.pdf.dir"));
        try (Stream<Path> files = Files.list(dir)) {
            for (Path f : files.filter(p -> p.toString().endsWith(".pdf")).sorted().toList()) {
                MemorySink sink = new MemorySink();
                var res = new PdfCatalogParser().parse(Files.readAllBytes(f), sink, null);
                long unique = res.items().stream().map(ParsedItem::code).distinct().count();
                long noImage = res.items().stream().filter(i -> i.imageRef() == null).count();
                System.out.printf("%s: pages=%d noText=%d rows=%d unique=%d images=%d noImage=%d warnings=%d%n",
                        f.getFileName(), res.pages(), res.pagesWithoutText(), res.items().size(), unique,
                        sink.images.size(), noImage, res.warnings().size());
                assertTrue(unique > 50, "слишком мало товаров в " + f.getFileName());
                assertTrue(noImage * 20 < res.items().size(), "много строк без фото в " + f.getFileName());
            }
        }
    }

    // ---------------------------------------------------------------- builders

    private interface Content { void draw(PDPageContentStream cs) throws IOException; }

    private static byte[] pdf(Content content) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                currentDoc = doc;
                content.draw(cs);
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private static PDDocument currentDoc;

    /** Картинка; x, top — от левого верхнего угла страницы. */
    private static void image(PDPageContentStream cs, Color color, float x, float top, float w, float h) throws IOException {
        BufferedImage img = new BufferedImage(60, 40, BufferedImage.TYPE_INT_ARGB);
        var g = img.createGraphics();
        g.setColor(color);
        g.fillRect(5, 5, 50, 30);
        g.dispose();
        PDImageXObject xo = LosslessFactory.createFromImage(currentDoc, img);
        cs.drawImage(xo, x, H - top - h, w, h);
    }

    private static void tableTrEn(PDPageContentStream cs, float top, float left, String[][] rows) throws IOException {
        tableTrEn(cs, top, left, rows, null);
    }

    /** Две рамки в строку: TR (код | описание) и EN (код | описание), как в каталогах Çeray. */
    private static void tableTrEn(PDPageContentStream cs, float top, float left, String[][] rows, String[] enCodes)
            throws IOException {
        float rowH = 11, codeW = 60, descW = 190;
        float trX = left, enX = left + codeW + descW + 5;
        String[] header = {"Ürün Kodu", "Urun Aciklamasi", "Product Code", "Product Description"};
        frame(cs, trX, top, codeW, descW, rows.length + 1, rowH);
        frame(cs, enX, top, codeW, descW, rows.length + 1, rowH);
        text(cs, trX + 2, top + 8, header[0]);
        text(cs, trX + codeW + 40, top + 8, header[1]);
        text(cs, enX + 2, top + 8, header[2]);
        text(cs, enX + codeW + 40, top + 8, header[3]);
        for (int r = 0; r < rows.length; r++) {
            float y = top + rowH * (r + 1) + 8;
            text(cs, trX + 2, y, rows[r][0]);
            text(cs, trX + codeW + 3, y, rows[r][1]);
            text(cs, enX + 2, y, enCodes != null ? enCodes[r] : rows[r][0]);
            text(cs, enX + codeW + 3, y, rows[r][2]);
        }
    }

    private static void frame(PDPageContentStream cs, float x, float top, float codeW, float descW, int rows, float rowH)
            throws IOException {
        float w = codeW + descW, hgt = rows * rowH;
        cs.setLineWidth(0.5f);
        for (int r = 0; r <= rows; r++) {
            cs.moveTo(x, H - top - r * rowH);
            cs.lineTo(x + w, H - top - r * rowH);
        }
        for (float vx : new float[]{x, x + codeW, x + w}) {
            cs.moveTo(vx, H - top);
            cs.lineTo(vx, H - top - hgt);
        }
        cs.stroke();
    }

    private static void text(PDPageContentStream cs, float x, float baselineTop, String s) throws IOException {
        cs.beginText();
        cs.setFont(FONT, 7);
        cs.setTextMatrix(Matrix.getTranslateInstance(x, H - baselineTop));
        cs.showText(s);
        cs.endText();
    }

    private static List<String> codes(List<ParsedItem> items) {
        return items.stream().map(ParsedItem::code).collect(Collectors.toList());
    }
}

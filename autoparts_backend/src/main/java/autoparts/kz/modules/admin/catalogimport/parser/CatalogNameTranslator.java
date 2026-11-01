package autoparts.kz.modules.admin.catalogimport.parser;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Перевод названий автосвета из каталогов поставщиков (английский, при отсутствии — турецкий) на русский
 * по словарю: тип изделия + прилагательные (с согласованием по роду) + исполнение/применение/сторона/цвет/вольтаж.
 * Незнакомые слова (модели техники, серии) остаются как в каталоге и возвращаются в {@link Result#leftovers()},
 * чтобы админ мог проверить название в превью.
 */
public final class CatalogNameTranslator {

    public record Result(String name, List<String> leftovers, List<String> voltages) {}

    private enum G { M, F, N }

    private record Head(String nom, String gen, G g) {}

    private static final LinkedHashMap<String, Head> HEADS = new LinkedHashMap<>();
    private static final LinkedHashMap<String, String> PHRASES = new LinkedHashMap<>();
    private static final LinkedHashMap<String, String> ADJ = new LinkedHashMap<>();
    private static final LinkedHashMap<String, String> APPLICATION = new LinkedHashMap<>();
    private static final Map<String, String> COLORS = new LinkedHashMap<>();
    /** Тип по одному слову — только если ничего точнее не нашлось ("EARTH MOVER SIGNAL LENS"). */
    private static final LinkedHashMap<String, Head> FALLBACK_HEADS = new LinkedHashMap<>();
    /** Деталь фонаря сразу после типа: "HEADLIGHT COWL" → "Кожух фары". */
    private static final Map<String, Head> PARTS = new LinkedHashMap<>();
    private static final Map<String, String> AS_IS = new LinkedHashMap<>();
    private static final Map<String, String> COMPOUND = Map.of(
            "красный", "красно", "жёлтый", "жёлто", "белый", "бело", "синий", "сине", "оранжевый", "оранжево",
            "зелёный", "зелёно", "чёрный", "черно", "серебристый", "серебристо");
    private static final Map<String, String> TYPE_ORIGIN = Map.of(
            "ITALIAN", "итальянского типа", "JAPAN", "японского типа", "AMERICAN", "американского типа",
            "FRANCE", "французского типа", "EURO", "европейского типа", "CANAL", "канального типа");
    private static final Set<String> STOP = Set.of("WITH", "AND", "FOR", "-", "TYPE", "OF", "THE");

    static {
        head("REAR COMBINATION LAMP", "Фонарь задний комбинированный", "заднего комбинированного фонаря", G.M);
        head("FRONT COMBINATION LAMP", "Фонарь передний комбинированный", "переднего комбинированного фонаря", G.M);
        head("COMBINATION LAMP", "Фонарь комбинированный", "комбинированного фонаря", G.M);
        head("NUMBER PLATE LAMP", "Фонарь освещения номера", "фонаря освещения номера", G.M);
        head("LICENSE PLATE LAMP", "Фонарь освещения номера", "фонаря освещения номера", G.M);
        head("SIDE MARKER LAMP", "Фонарь габаритный боковой", "бокового габаритного фонаря", G.M);
        head("RUBBER MARKER LAMP", "Фонарь габаритный на резиновой ножке", "габаритного фонаря на резиновой ножке", G.M);
        head("MARKER LAMP", "Фонарь габаритный", "габаритного фонаря", G.M);
        head("MARKER LIGHT", "Фонарь габаритный", "габаритного фонаря", G.M);
        head("POSITION LAMP", "Фонарь габаритный", "габаритного фонаря", G.M);
        head("FRONT PARKING LAMP", "Фонарь передний габаритный", "переднего габаритного фонаря", G.M);
        head("PARKING LAMP", "Фонарь габаритный", "габаритного фонаря", G.M);
        head("SIDE SIGNAL LAMP", "Повторитель поворота боковой", "бокового повторителя поворота", G.M);
        head("SIGNAL LAMP", "Указатель поворота", "указателя поворота", G.M);
        head("SIGNAL LIGHT", "Указатель поворота", "указателя поворота", G.M);
        head("INDICATOR LAMP", "Указатель поворота", "указателя поворота", G.M);
        head("FLASHER BEACON LAMP", "Маячок проблесковый", "проблескового маячка", G.M);
        head("BEACON LAMP", "Маячок проблесковый", "проблескового маячка", G.M);
        head("FLASHER LAMP", "Маячок проблесковый", "проблескового маячка", G.M);
        head("ROTATION/FLASHER", "Маячок проблесковый", "проблескового маячка", G.M);
        head("BEACON", "Маячок проблесковый", "проблескового маячка", G.M);
        head("WORK LAMP", "Фара рабочего света", "фары рабочего света", G.F);
        head("WORK LIGHT", "Фара рабочего света", "фары рабочего света", G.F);
        head("FOG LAMP", "Фара противотуманная", "противотуманной фары", G.F);
        head("DRIVING LIGHTS", "Фара противотуманная", "противотуманной фары", G.F);
        head("DRIVING LIGHT", "Фара противотуманная", "противотуманной фары", G.F);
        head("REVERSING LAMP", "Фонарь заднего хода", "фонаря заднего хода", G.M);
        head("BACK HEADLIGHT", "Фара задняя", "задней фары", G.F);
        head("DOUBLE CLAMP HEADLIGHT", "Фара с двойным хомутом", "фары с двойным хомутом", G.F);
        head("BULB SOCKET", "Патрон лампы", "патрона лампы", G.M);
        head("HEADLIGHT REFLECTOR", "Отражатель фары", "отражателя фары", G.M);
        head("NUMBER PLATE FRAME", "Рамка номерного знака", "рамки номерного знака", G.F);
        head("REAR COMBINATION", "Фонарь задний комбинированный", "заднего комбинированного фонаря", G.M);
        head("HEADLIGHT ASSEMBLY", "Фара в сборе", "фары в сборе", G.F);
        head("HEADLIGHT COWL", "Кожух фары", "кожуха фары", G.M);
        head("HEADLIGHT", "Фара", "фары", G.F);
        head("HEAD LAMP", "Фара", "фары", G.F);
        head("HEADLAMP", "Фара", "фары", G.F);
        head("FRONT LAMP", "Фонарь передний", "переднего фонаря", G.M);
        head("REAR LAMP", "Фонарь задний", "заднего фонаря", G.M);
        head("BACK LAMP", "Фонарь задний", "заднего фонаря", G.M);
        head("STOP LAMP", "Фонарь задний", "заднего фонаря", G.M);
        head("TAIL LAMP", "Фонарь задний", "заднего фонаря", G.M);
        head("REAR", "Фонарь задний", "заднего фонаря", G.M); // "HAMBURGER REAR RED-AMBER-CLEAR"
        head("REFLECTOR", "Световозвращатель", "световозвращателя", G.M);
        head("FRONT GRILLE", "Решётка радиатора", "решётки радиатора", G.F);
        head("GRILLE", "Решётка", "решётки", G.F);
        head("EMBLEM", "Эмблема", "эмблемы", G.F);
        head("SEAT HEATING SWITCH", "Переключатель подогрева сиденья", "переключателя подогрева сиденья", G.M);
        head("SWITCH", "Переключатель", "переключателя", G.M);
        head("FRAME", "Рамка", "рамки", G.F);
        head("BULB", "Лампа", "лампы", G.F);
        head("KIT", "Комплект", "комплекта", G.M);
        head("SCREW", "Винт", "винта", G.M);
        head("CLAMP", "Хомут", "хомута", G.M);
        head("SUPPORT", "Кронштейн", "кронштейна", G.M);
        head("BRACKET", "Кронштейн", "кронштейна", G.M);
        head("COVER", "Накладка", "накладки", G.F);
        head("SOCKET", "Разъём", "разъёма", G.M);
        head("CABLE", "Кабель", "кабеля", G.M);
        head("LAMPS", "Фонарь", "фонаря", G.M);
        head("LAMP", "Фонарь", "фонаря", G.M);
        head("LIGHTS", "Фонарь", "фонаря", G.M);
        head("LIGHT", "Фонарь", "фонаря", G.M);

        PHRASES.put("WITH LAMPS", "с подсветкой");
        PHRASES.put("WITH MARKER LAMP", "с габаритным фонарём");
        PHRASES.put("WITH SCREW", "на винте");
        PHRASES.put("WITH LAMP", "с подсветкой");
        PHRASES.put("WITH PATTERNED LENS", "с рифлёным стеклом");
        PHRASES.put("WITH FLAT LENS", "с плоским стеклом");
        PHRASES.put("CENTRAL CONNECTION", "с центральным подключением");
        PHRASES.put("2XH3", "под лампы 2×H3");
        PHRASES.put("WITH RUBBER FRAME", "в резиновом корпусе");
        PHRASES.put("WITH SUPPORT", "с кронштейном");
        PHRASES.put("SIDE CONNECTION", "с боковым подключением");
        PHRASES.put("TRIANGLE REFLECTOR", "с треугольным световозвращателем"); // только если есть другой тип
        PHRASES.put("WITH 6-PIN DEUTSCH SOCKET", "с разъёмом Deutsch 6-pin");
        PHRASES.put("6-PIN DEUTSCH SOCKET", "с разъёмом Deutsch 6-pin");
        PHRASES.put("WITH AMP SOCKET", "с разъёмом AMP");
        PHRASES.put("WITH SQUARE SOCKET", "с квадратным разъёмом");
        PHRASES.put("WITH ROUND SOCKET", "с круглым разъёмом");
        PHRASES.put("WITH SOCKET", "с разъёмом");
        PHRASES.put("AMP SOCKET", "с разъёмом AMP");
        PHRASES.put("WITH CABLE", "с кабелем");
        PHRASES.put("WITH WIRE", "с кабелем");
        PHRASES.put("WITH MAGNET", "на магните");
        PHRASES.put("CIGARETTE PLUG", "с вилкой прикуривателя");
        PHRASES.put("WITH EMBLEM", "с эмблемой");
        PHRASES.put("WITH BULB", "с лампой");
        PHRASES.put("AND YELLOW SIGNAL", "с жёлтым поворотником");
        PHRASES.put("DYNAMIC SIGNAL", "с динамическим поворотником");
        PHRASES.put("DYNAMIC INDICATOR", "с динамическим поворотником");
        PHRASES.put("DYNAMIC", "с динамическим поворотником");
        PHRASES.put("METAL BODY", "в металлическом корпусе");
        PHRASES.put("CHROME BODY", "в хромированном корпусе");
        PHRASES.put("PLASTIC BODY", "в пластиковом корпусе");
        PHRASES.put("BLACK BODY", "в чёрном корпусе");
        PHRASES.put("CHROME COVER", "с хромированной рамкой");
        PHRASES.put("LATTICED", "с защитной решёткой");
        PHRASES.put("NEW MODEL", "новая модель");
        PHRASES.put("OLD MODEL", "старая модель");
        PHRASES.put("DOUBLE LINE", "двухрядный");
        PHRASES.put("FLASHER", "мигающий");

        ADJ.put("RECTANGULAR", "прямоугольный");
        ADJ.put("SQUARE", "квадратный");
        ADJ.put("ROUND", "круглый");
        ADJ.put("OVAL", "овальный");
        ADJ.put("TRIANGLE", "треугольный");
        ADJ.put("CHROME", "хромированный");
        ADJ.put("DARK", "тонированный");
        ADJ.put("SMOKED", "тонированный");
        ADJ.put("UNIVERSAL", "универсальный");
        ADJ.put("LEDS", "светодиодный");
        ADJ.put("LED", "светодиодный");
        ADJ.put("NEON", "неоновый");
        ADJ.put("METAL", "металлический");
        ADJ.put("PLASTIC", "пластиковый");
        ADJ.put("RUBBER", "резиновый");
        ADJ.put("DOUBLE", "двойной");
        ADJ.put("TWIN", "двойной");
        ADJ.put("SHORT", "короткий");
        ADJ.put("LONG", "длинный");
        ADJ.put("FLAT", "плоский");
        ADJ.put("POWERFUL", "мощный");
        ADJ.put("MIDDLE", "средний");
        ADJ.put("CENTRAL", "центральный");
        ADJ.put("SIDE", "боковой");
        ADJ.put("FRONT", "передний");
        ADJ.put("BACK", "задний");
        ADJ.put("NORMAL", "обычный");
        ADJ.put("ROTATION", "вращающийся");
        ADJ.put("FLASHING", "проблесковый");
        ADJ.put("PATTERNED", "рифлёный");
        ADJ.put("FIGURED", "рифлёный");
        ADJ.put("SIGNAL", "с поворотником");
        ADJ.put("HEATING", "с подогревом");

        FALLBACK_HEADS.put("POSITION", new Head("Фонарь габаритный", "габаритного фонаря", G.M));
        FALLBACK_HEADS.put("SIGNAL", new Head("Указатель поворота", "указателя поворота", G.M));

        PARTS.put("SUPPORT", new Head("Кронштейн", null, G.M));
        PARTS.put("BRACKET", new Head("Кронштейн", null, G.M));
        PARTS.put("COWL", new Head("Кожух", null, G.M));
        PARTS.put("REFLECTOR", new Head("Отражатель", null, G.M));
        PARTS.put("COVER", new Head("Накладка", null, G.F));
        PARTS.put("FRAME", new Head("Рамка", null, G.F));

        AS_IS.put("MINI", "мини");
        AS_IS.put("JAPAN", "японского типа");
        AS_IS.put("MAXI", "макси");
        AS_IS.put("MICRO", "микро");
        AS_IS.put("MEGA", "мега");

        APPLICATION.put("TRACTOR CABIN", "для кабины трактора");
        APPLICATION.put("TRUCK TRAILER", "для грузовика и прицепа");
        APPLICATION.put("EARTH MOVER", "для спецтехники");
        APPLICATION.put("EARTH MOVERS", "для спецтехники");
        APPLICATION.put("CONSTRUCTION MACHINERY", "для спецтехники");
        APPLICATION.put("TRACTOR", "для трактора");
        APPLICATION.put("TRAKTÖR", "для трактора");
        APPLICATION.put("TRUCK", "для грузовика");
        APPLICATION.put("TRAILER", "для прицепа");
        APPLICATION.put("FORKLIFT", "для погрузчика");
        APPLICATION.put("COMBINE", "для комбайна");
        APPLICATION.put("GARDEN", "для садовой техники");
        APPLICATION.put("BUS", "для автобуса");
        APPLICATION.put("CABIN", "для кабины");

        COLORS.put("RED", "красный");
        COLORS.put("AMBER", "жёлтый");
        COLORS.put("YELLOW", "жёлтый");
        COLORS.put("ORANGE", "оранжевый");
        COLORS.put("CLEAR", "белый");
        COLORS.put("WHITE", "белый");
        COLORS.put("BLUE", "синий");
        COLORS.put("GREEN", "зелёный");
        COLORS.put("BLACK", "чёрный");
        COLORS.put("SILVER", "серебристый");
    }

    private static void head(String en, String nom, String gen, G g) {
        HEADS.put(en, new Head(nom, gen, g));
    }

    /** Опечатки и сокращения каталогов. */
    private static final String[][] FIXES = {
            {"SINGAL", "SIGNAL"}, {"RECTANGLER", "RECTANGULAR"}, {"DEFNDER", "DEFENDER"}, {"GERDEN", "GARDEN"},
            {"LAMPLENS", "LAMP LENS"}, {"LICENCE", "LICENSE"}, {"LIGHTNING", "LIGHTING"},
            {"CONS. MACH.", "EARTH MOVER"}, {"COMB.", "COMBINATION"}, {"FUNC.", "FUNCTIONS"}, {"FONK.", "FONKSİYONLU"},
            {"VOLTS", "VOLT"}, {"BODY-", "BODY "}, {"SOCKET-CANAL", "SOCKET CANAL"},
            {"BEACON ROTATION LAMP", "BEACON LAMP ROTATION"}, {"ROTATION/FLASHER LAMP", "BEACON LAMP"},
            {"ROTATION LAMP", "BEACON LAMP ROTATION"}, {"FLASHER BEACON", "BEACON"},
            {"LENS - PATTERNED LENS", "LENS PATTERNED"}, {"LENS - FLAT LENS", "LENS FLAT"},
            {"- PATTERNED LENS", " WITH PATTERNED LENS"}, {"- FLAT LENS", " WITH FLAT LENS"},
            {"LICENSE PLATE FRAME", "NUMBER PLATE FRAME"}, {"LAMP CABLE WITH", "LAMP WITH CABLE WITH"},
            {"LAMP SOCKET WITH", "LAMP WITH SOCKET WITH"}, {"2XH3 BULB", "2XH3"}};

    /** Минимальный турецкий → английский, когда английской половины в каталоге нет. */
    private static final String[][] TR_EN = {
            {"STOP SİNYAL LAMBASI", "REAR COMBINATION LAMP"}, {"STOP LAMBASI", "REAR LAMP"}, {"STOP LAMBA", "REAR LAMP"},
            {"PLAKA LAMBASI", "NUMBER PLATE LAMP"}, {"ÇALIŞMA LAMBASI", "WORK LAMP"}, {"SİS FARI", "FOG LAMP"},
            {"SİS LAMBASI", "FOG LAMP"}, {"ÖN PARK LAMBASI", "FRONT PARKING LAMP"}, {"ÖN PARK LAMBA", "FRONT PARKING LAMP"},
            {"YAN POZİSYON LAMBASI", "SIDE MARKER LAMP"}, {"POZİSYON LAMBASI", "POSITION LAMP"},
            {"TAKOZ LAMBA", "RUBBER MARKER LAMP"}, {"SİNYAL LAMBASI", "SIGNAL LAMP"}, {"ÖN FAR", "HEADLIGHT"},
            {"İŞ MAKİNASI", "EARTH MOVER"}, {"KABLOLU", "WITH CABLE"}, {"SOKETLİ", "WITH SOCKET"},
            {"LAMBASI", "LAMP"}, {"LAMBA", "LAMP"}, {"FARI", "HEADLIGHT"}, {"FAR", "HEADLIGHT"}, {"CAMI", "LENS"},
            {"CAM", "LENS"}, {"SOL", "LEFT"}, {"SAĞ", "RIGHT"}, {"TRAKTÖR", "TRACTOR"}, {"KAMYON", "TRUCK"},
            {"DORSE", "TRAILER"}, {"KIRMIZI", "RED"}, {"SARI", "AMBER"}, {"BEYAZ", "CLEAR"}, {"MAVİ", "BLUE"},
            {"KARE", "SQUARE"}, {"YUVARLAK", "ROUND"}, {"DİKDÖRTGEN", "RECTANGULAR"}, {"KROM", "CHROME"},
            {"FÜME", "DARK"}, {"DİNAMİK", "DYNAMIC"}, {"YAN", "SIDE"}, {"ÖN", "FRONT"}, {"ARKA", "REAR"},
            {"IZGARA", "GRILLE"}, {"AMBLEM", "EMBLEM"}};

    private static final Pattern VOLT = Pattern.compile("\\b(\\d{1,3}(?:[-/]\\d{1,3})?) ?(?:V|VOLT)\\b");
    private static final Pattern FUNCTIONS = Pattern.compile("\\b(\\d{1,2}) ?(?:FUNCTIONS?|FUNC|FONKSİYONLU)\\b");
    private static final Pattern PIN_SOCKET = Pattern.compile("\\b(?:WITH )?(\\d{1,2}[ -]PIN(?: DEUTSCH)?) SOCKET\\b");
    private static final Pattern SERIES = Pattern.compile("\\b(\\d{2,5}) SERIES\\b");
    private static final Pattern LED_COUNT = Pattern.compile("\\b(\\d{1,3}) LEDS?\\b");
    private static final Pattern CM = Pattern.compile("\\b(\\d{1,3}) ?CM\\b");
    private static final Pattern ORIGIN_TYPE = Pattern.compile("\\b([A-Z]+) TYPE\\b");

    public Result translate(String en, String tr) {
        boolean fromTr = en == null || en.isBlank();
        String src = fromTr ? (tr == null ? "" : tr) : en;
        String s = " " + src.toUpperCase(Locale.ROOT).replace('–', '-').replace('—', '-') + " ";
        if (!fromTr) s = s.replace('İ', 'I');
        for (String[] f : FIXES) s = s.replace(f[0], f[1]);
        if (fromTr || looksTurkish(s)) {
            for (String[] f : TR_EN) s = s.replaceAll("(?<=[\\s-])" + Pattern.quote(f[0]) + "(?=[\\s.,-])", f[1]);
        }
        s = s.replace(" - ", " ").replace(",", " ").replaceAll("\\s+", " ");

        List<String> tail = new ArrayList<>();
        List<String> voltages = new ArrayList<>();
        Matcher m = VOLT.matcher(s);
        while (m.find()) voltages.add(m.group(1) + "V");
        s = VOLT.matcher(s).replaceAll(" ");
        s = extract(s, FUNCTIONS, tail, g -> g + " функц.");
        s = extract(s, LED_COUNT, tail, g -> "светодиодов: " + g);
        s = extract(s, CM, tail, g -> g + " см");
        s = extract(s, SERIES, tail, g -> "серия " + g);
        List<String> phrases = new ArrayList<>();
        s = extract(s, PIN_SOCKET, phrases, g -> "с разъёмом " + g.replace(" DEUTSCH", "").replace(' ', '-').toLowerCase(Locale.ROOT)
                .replace("pin", "pin") + (g.contains("DEUTSCH") ? " Deutsch" : ""));
        m = ORIGIN_TYPE.matcher(s);
        if (m.find() && TYPE_ORIGIN.containsKey(m.group(1))) {
            tail.add(TYPE_ORIGIN.get(m.group(1)));
            s = s.substring(0, m.start()) + " " + s.substring(m.end());
        }

        // тип изделия; стекло — отдельное изделие "стекло <чего>"
        boolean lens = s.matches(".*\\bLENS\\b.*") && !s.matches(".*\\bWITH (FLAT|PATTERNED) LENS\\b.*");
        if (lens) s = s.replaceAll("(?<!FLAT |PATTERNED )\\bLENS\\b", " ");
        boolean hasOtherHead = false;
        Head head = null;
        for (var e : HEADS.entrySet()) {
            if (e.getKey().equals("REFLECTOR")) continue;
            if (contains(s, e.getKey())) { hasOtherHead = true; break; }
        }
        for (var e : PHRASES.entrySet()) {
            if (e.getKey().equals("TRIANGLE REFLECTOR") && !hasOtherHead) continue;
            if (contains(s, e.getKey())) {
                phrases.add(e.getValue());
                s = remove(s, e.getKey());
            }
        }
        // главный тип — самый левый (при равенстве — самый длинный); за ним может стоять деталь (COWL, SUPPORT)
        int bestPos = Integer.MAX_VALUE;
        String bestKey = null;
        for (var e : HEADS.entrySet()) {
            int pos = indexOf(s, e.getKey());
            if (pos >= 0 && (pos < bestPos || (pos == bestPos && e.getKey().length() > bestKey.length()))) {
                bestPos = pos;
                bestKey = e.getKey();
            }
        }
        if (bestKey == null) {
            for (var e : FALLBACK_HEADS.entrySet()) {
                if (contains(s, e.getKey())) { bestKey = e.getKey(); head = e.getValue(); break; }
            }
        } else {
            head = HEADS.get(bestKey);
        }
        Head part = null;
        if (bestKey != null) {
            Matcher pm = Pattern.compile("(?<![A-Z0-9])" + Pattern.quote(bestKey) + "((?: [0-9][0-9-]*)*) ([A-Z]+)(?![A-Z0-9])").matcher(s);
            if (pm.find() && PARTS.containsKey(pm.group(2)) && head.gen != null) {
                part = PARTS.get(pm.group(2));
                s = s.substring(0, pm.start(2)) + " " + s.substring(pm.end(2));
            }
            s = remove(s, bestKey);
        }
        List<String> applications = new ArrayList<>();
        for (var e : APPLICATION.entrySet()) {
            if (contains(s, e.getKey())) {
                applications.add(e.getValue());
                s = remove(s, e.getKey());
            }
        }

        String nom;
        G g;
        if (lens) {
            nom = "Стекло " + (head != null ? head.gen : "фонаря");
            g = G.N;
        } else if (part != null) {
            nom = part.nom + " " + head.gen;
            g = part.g;
        } else if (head != null) {
            nom = head.nom;
            g = head.g;
        } else {
            nom = null;
            g = G.M;
        }

        List<String> adjs = new ArrayList<>();
        String side = null;
        List<String> colors = new ArrayList<>();
        List<String> leftovers = new ArrayList<>();
        List<String> keep = new ArrayList<>();
        for (String tok : s.trim().split(" ")) {
            if (tok.isEmpty() || STOP.contains(tok)) continue;
            if (tok.equals("LEFT") || tok.equals("LH")) { side = agree("левый", g); continue; }
            if (tok.equals("RIGHT") || tok.equals("RH")) { side = agree("правый", g); continue; }
            if (tok.startsWith("-") || tok.endsWith("-")) tok = tok.replaceAll("^-+|-+$", "");
            if (tok.isEmpty()) continue;
            if (AS_IS.containsKey(tok)) { keep.add(AS_IS.get(tok)); continue; }
            String color = colorOf(tok);
            if (color != null) { colors.add(color); continue; }
            String adj = ADJ.get(tok);
            if (adj != null && adj.startsWith("с ")) {
                if (!phrases.contains(adj)) phrases.add(adj);
                continue;
            }
            if (adj != null) {
                String a = agree(adj, g);
                // "боковой"/"передний" уже в названии типа
                if (!adjs.contains(a) && (nom == null || !nom.toLowerCase(Locale.ROOT).contains(a))) adjs.add(a);
                continue;
            }
            keep.add(tok);
            if (tok.chars().anyMatch(Character::isLetter)) leftovers.add(tok);
        }

        StringBuilder sb = new StringBuilder();
        if (nom != null) sb.append(nom); else sb.append("Изделие");
        for (String a : adjs) sb.append(' ').append(a);
        if (!keep.isEmpty()) sb.append(' ').append(String.join(" ", keep));
        List<String> rest = new ArrayList<>(phrases);
        rest.addAll(tail);
        rest.addAll(applications);
        if (side != null) rest.add(side);
        if (!colors.isEmpty()) rest.add(colorPhrase(new ArrayList<>(new LinkedHashSet<>(colors)), g));
        if (!voltages.isEmpty()) rest.add(String.join(", ", voltages));
        for (String r : rest) sb.append(", ").append(r);
        if (nom == null) leftovers.add(0, "(тип изделия не распознан)");
        return new Result(sb.toString(), leftovers, voltages);
    }

    private static boolean looksTurkish(String s) {
        return s.matches(".*\\b(LAMBASI|LAMBA|FARI|CAMI|SOL|SAĞ|KIRMIZI|SARI)\\b.*");
    }

    private interface Fmt { String f(String g); }

    private static String extract(String s, Pattern p, List<String> out, Fmt fmt) {
        Matcher m = p.matcher(s);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            out.add(fmt.f(m.group(1)));
            m.appendReplacement(sb, " ");
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private static boolean contains(String s, String phrase) {
        return Pattern.compile("(?<![A-Z0-9])" + Pattern.quote(phrase) + "(?![A-Z0-9])").matcher(s).find();
    }

    private static String remove(String s, String phrase) {
        return s.replaceFirst("(?<![A-Z0-9])" + Pattern.quote(phrase) + "(?![A-Z0-9])", " ");
    }

    /** ["красный","жёлтый"] → "красно-жёлтый" (последняя часть согласуется с родом). */
    private static String colorPhrase(List<String> colors, G g) {
        List<String> flat = new ArrayList<>();
        for (String c : colors) flat.addAll(Arrays.asList(c.split("/")));
        flat = new ArrayList<>(new LinkedHashSet<>(flat));
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < flat.size() - 1; i++) sb.append(COMPOUND.getOrDefault(flat.get(i), flat.get(i))).append('-');
        return sb.append(agree(flat.get(flat.size() - 1), g)).toString();
    }

    private static int indexOf(String s, String phrase) {
        Matcher m = Pattern.compile("(?<![A-Z0-9])" + Pattern.quote(phrase) + "(?![A-Z0-9])").matcher(s);
        return m.find() ? m.start() : -1;
    }

    private static String colorOf(String tok) {
        String[] parts = tok.split("[-/]");
        List<String> res = new ArrayList<>();
        for (String p : parts) {
            String c = COLORS.get(p);
            if (c == null) return null;
            res.add(c);
        }
        return String.join("/", res);
    }

    /** Прилагательное в мужском роде → нужный род (для "стекла" — средний). */
    static String agree(String adjM, G g) {
        if (g == G.M || adjM.length() < 3) return adjM;
        String stem = adjM.substring(0, adjM.length() - 2);
        String end = adjM.substring(adjM.length() - 2);
        boolean hard = end.equals("ый") || end.equals("ой")
                || (end.equals("ий") && "кгхжшчщ".indexOf(stem.charAt(stem.length() - 1)) >= 0);
        if (end.equals("ий") && "жшчщ".indexOf(stem.charAt(stem.length() - 1)) >= 0) {
            return stem + (g == G.F ? "ая" : "ее"); // свежий → свежая/свежее
        }
        if (hard) return stem + (g == G.F ? "ая" : "ое");
        if (end.equals("ий")) return stem + (g == G.F ? "яя" : "ее");
        return adjM;
    }
}

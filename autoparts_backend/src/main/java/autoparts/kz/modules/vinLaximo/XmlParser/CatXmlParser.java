package autoparts.kz.modules.vinLaximo.XmlParser;

import autoparts.kz.modules.vinLaximo.dto.*;
import org.w3c.dom.*;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.*;
import java.io.StringReader;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CatXmlParser {

    // -------- Санитайзер --------
    private static final Pattern DOCTYPE_PATTERN =
            Pattern.compile("<!DOCTYPE[^>]*>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    // Блоки, где часто встречается «сырой» HTML
    private static final Pattern TAG_BLOCK_PATTERN =
            Pattern.compile("(?is)(<note[^>]*>)(.*?)(</note>)|(?is)(<description[^>]*>)(.*?)(</description>)");

    private static String xmlTextEscape(String s) {
        if (s == null) return null;
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private static String sanitizeXml(String xml) {
        if (xml == null) return null;

        // 0) Если апстрим прислал HTML-страницу целиком — не парсим как XML
        String head = xml.stripLeading();
        if (head.startsWith("<!DOCTYPE html") || head.startsWith("<html")) {
            throw new RuntimeException("Laximo returned HTML page (probably error). First 200 chars: " +
                    head.substring(0, Math.min(200, head.length())).replaceAll("\\s+", " "));
        }

        // 1) Срезаем DOCTYPE (встречается и внутри)
        xml = DOCTYPE_PATTERN.matcher(xml).replaceAll("");

        // 2) Удаляем проблемные теги, ломающие XML при отсутствии закрывающих
        xml = xml.replaceAll("(?is)<link\\b[^>]*>", "");
        xml = xml.replaceAll("(?is)<meta\\b[^>]*>", "");
        xml = xml.replaceAll("(?is)<script\\b[^>]*>.*?</script>", "");
        xml = xml.replaceAll("(?is)<style\\b[^>]*>.*?</style>", "");

        // 3) Нормализуем void-теги к XML-форме
        xml = xml.replaceAll("(?i)<br>", "<br/>");
        xml = xml.replaceAll("(?i)<hr>", "<hr/>");
        xml = xml.replaceAll("(?is)<img([^>/]*?)>", "<img$1/>");
        xml = xml.replaceAll("(?is)<input([^>/]*?)>", "<input$1/>");

        // 4) Экранируем «сырой» HTML внутри <note> / <description>
        Matcher m = TAG_BLOCK_PATTERN.matcher(xml);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String open = m.group(1) != null ? m.group(1) : m.group(4);
            String body = m.group(2) != null ? m.group(2) : m.group(5);
            String close = m.group(3) != null ? m.group(3) : m.group(6);
            String safeBody = xmlTextEscape(body);
            m.appendReplacement(sb, Matcher.quoteReplacement(open + safeBody + close));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    // -------- Безопасный DOM-парсер --------
    private static Document toDoc(String xml) {
        try {
            xml = sanitizeXml(xml);

            DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
            f.setNamespaceAware(false);
            f.setXIncludeAware(false);
            f.setExpandEntityReferences(false);

            // Отключаем внешние DTD/ENTITY
            safeSetFeature(f, "http://xml.org/sax/features/external-general-entities", false);
            safeSetFeature(f, "http://xml.org/sax/features/external-parameter-entities", false);
            safeSetFeature(f, "http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            safeSetFeature(f, "http://apache.org/xml/features/validation/schema", false);
            safeSetFeature(f, "http://apache.org/xml/features/validation/dynamic", false);

            var b = f.newDocumentBuilder();
            // Глушим попытки резолвить внешние сущности
            b.setEntityResolver((publicId, systemId) -> new org.xml.sax.InputSource(new java.io.StringReader("")));
            return b.parse(new InputSource(new StringReader(xml)));
        } catch (Exception e) {
            throw new RuntimeException("XML parse error", e);
        }
    }

    private static void safeSetFeature(DocumentBuilderFactory f, String feature, boolean value) {
        try { f.setFeature(feature, value); } catch (Exception ignore) { /* разные имплементации JAXP */ }
    }

    private static String attr(Node n, String name) {
        if (n == null || n.getAttributes() == null) return null;
        Node a = n.getAttributes().getNamedItem(name);
        return a == null ? null : a.getNodeValue();
    }

    private static NodeList xp(Document d, String path) {
        try {
            XPath x = XPathFactory.newInstance().newXPath();
            return (NodeList) x.compile(path).evaluate(d, XPathConstants.NODESET);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static void appendCatalog(OemPartReferenceDto dto, String brand, String code, String catalogName) {
        String normalizedBrand = trimToNull(brand);
        String normalizedCode = trimToNull(code);
        String normalizedName = trimToNull(catalogName);

        if (normalizedBrand == null && normalizedCode == null && normalizedName == null) {
            return;
        }

        for (OemCatalogReferenceDto existing : dto.getCatalogs()) {
            String eb = trimToNull(existing.getBrand());
            String ec = trimToNull(existing.getCode());
            if (Objects.equals(eb, normalizedBrand) && Objects.equals(ec, normalizedCode)) {
                if ((existing.getName() == null || existing.getName().isBlank()) && normalizedName != null) {
                    existing.setName(normalizedName);
                }
                return;
            }
        }

        OemCatalogReferenceDto catalog = new OemCatalogReferenceDto();
        catalog.setBrand(normalizedBrand);
        catalog.setCode(normalizedCode);
        catalog.setName(normalizedName);
        dto.getCatalogs().add(catalog);
    }

    private static Boolean boolAttr(Node n, String name) {
        String v = attr(n, name);
        if (v == null) return null;
        return "true".equalsIgnoreCase(v) || "1".equals(v);
    }

    private static String safe(String s) { return s == null ? "" : s.replace("'", "&apos;"); }

    private static Integer parseInt(String s){
        if (s==null || s.isBlank()) return null;
        try { return Integer.parseInt(s); } catch (Exception e){ return null; }
    }

    // ================== Parsers ==================

    // -------- Catalogs --------
    public static List<CatalogDto> parseListCatalogs(String xml) {
        Document d = toDoc(xml);
        NodeList rows = xp(d, "//ListCatalogs/row");
        List<CatalogDto> out = new ArrayList<>();
        for (int i = 0; i < rows.getLength(); i++) {
            Node r = rows.item(i);
            CatalogDto c = new CatalogDto();
            c.setCode(attr(r, "code"));
            c.setName(attr(r, "name"));
            c.setBrand(attr(r, "brand"));
            c.setRegion(attr(r, "region"));
            c.setIcon(attr(r, "icon"));

            // support* флаги
            c.setSupportVinSearch(boolAttr(r, "supportvinsearch"));
            c.setSupportFrameSearch(boolAttr(r, "supportframesearch"));
            c.setSupportQuickGroups(boolAttr(r, "supportquickgroups"));
            c.setSupportDetailApplicability(boolAttr(r, "supportdetailapplicability"));
            c.setSupportParameterIdentification(boolAttr(r, "supportparameteridentification"));
            c.setSupportParameterIdentification2(boolAttr(r, "supportparameteridentification2"));

            // примеры
            c.setVinExample(attr(r, "vinexample"));
            c.setFrameExample(attr(r, "frameexample"));

            // <features><feature .../></features>
            List<FeatureDto> feats = new ArrayList<>();
            NodeList fs = xp((Document) r.getOwnerDocument(),
                    "//ListCatalogs/row[@code='" + safe(c.getCode()) + "']/features/feature");
            for (int j = 0; j < fs.getLength(); j++) {
                Node f = fs.item(j);
                FeatureDto fd = new FeatureDto();
                fd.setName(attr(f, "name"));
                fd.setExample(attr(f, "example"));
                feats.add(fd);
            }
            c.setFeatures(feats);

            // <extensions><operations><operation ...><field .../></operation>...</operations></extensions>
            List<OperationDto> ops = new ArrayList<>();
            NodeList os = xp((Document) r.getOwnerDocument(),
                    "//ListCatalogs/row[@code='" + safe(c.getCode()) + "']/extensions/operations/operation");
            for (int k = 0; k < os.getLength(); k++) {
                Node op = os.item(k);
                OperationDto od = new OperationDto();
                od.setName(attr(op, "name"));
                od.setDescription(attr(op, "description"));
                od.setKind(attr(op, "kind"));

                List<OperationFieldDto> fields = new ArrayList<>();
                NodeList fl = op.getChildNodes();
                for (int m = 0; m < fl.getLength(); m++) {
                    Node f = fl.item(m);
                    if (!"field".equalsIgnoreCase(f.getNodeName())) continue;
                    OperationFieldDto of = new OperationFieldDto();
                    of.setName(attr(f, "name"));
                    of.setDescription(attr(f, "description"));
                    of.setExample(attr(f, "example"));
                    of.setPattern(attr(f, "pattern"));
                    fields.add(of);
                }
                od.setFields(fields);
                ops.add(od);
            }
            c.setOperations(ops);

            out.add(c);
        }
        return out;
    }

    public static CatalogInfoDto parseGetCatalogInfo(String xml) {
        Document d = toDoc(xml);
        Node row = xp(d, "//GetCatalogInfo/row").item(0);
        if (row == null) {
            throw new RuntimeException("GetCatalogInfo: row not found");
        }

        CatalogInfoDto dto = new CatalogInfoDto();
        dto.setCode(attr(row, "code"));
        dto.setName(attr(row, "name"));

        Map<String,String> attrs = new LinkedHashMap<>();
        NodeList list = xp(d, "//GetCatalogInfo/row/attribute");
        for (int i = 0; i < list.getLength(); i++) {
            Node a = list.item(i);
            String key = attr(a, "key");
            String val = attr(a, "value");
            if (key != null) {
                attrs.put(key, val);
            }
        }
        dto.setAttributes(attrs);
        return dto;
    }

    // -------- Vehicle search --------
    public static VehicleDto parseFindVehicleByVin(String xml) {
        return parseVehicleGeneric(xml, "FindVehicleByVIN");
    }
    public static VehicleDto parseFindVehicleByFrame(String xml) {
        return parseVehicleGeneric(xml, "FindVehicleByFrame");
    }
    public static VehicleDto parseFindVehicleByPlateNumber(String xml) {
        return parseVehicleGeneric(xml, "FindVehicleByPlateNumber");
    }
    public static VehicleDto parseFindVehicleByWizard2(String xml) {
        return parseVehicleGeneric(xml, "FindVehicleByWizard2");
    }

    private static VehicleDto parseVehicleGeneric(String xml, String node) {
        Document d = toDoc(xml);
        Node r = xp(d, "//" + node + "/row").item(0);
        if (r == null) throw new RuntimeException("Vehicle not found (" + node + ")");
        VehicleDto v = new VehicleDto();
        v.setVehicleId(attr(r, "vehicleid"));
        v.setSsd(attr(r, "ssd"));
        v.setCatalog(attr(r, "catalog"));
        v.setBrand(attr(r, "brand"));
        v.setName(attr(r, "name"));

        List<VehicleAttrDto> lst = new ArrayList<>();
        NodeList attrs = xp(d, "//" + node + "/row/attribute");
        for (int i = 0; i < attrs.getLength(); i++) {
            Node a = attrs.item(i);
            VehicleAttrDto dto = new VehicleAttrDto();
            dto.setCode(attr(a, "code"));
            dto.setLabel(attr(a, "name"));
            List<String> values = new ArrayList<>();
            NodeList vs = a.getChildNodes();
            for (int j = 0; j < vs.getLength(); j++) {
                Node ch = vs.item(j);
                if ("value".equalsIgnoreCase(ch.getNodeName())) values.add(ch.getTextContent());
            }
            dto.setValues(values);
            lst.add(dto);
        }
        v.setAttributes(lst);
        return v;
    }

    // -------- Wizard (GetWizard2 / GetWizardNextStep2) --------
    public static WizardStepDto parseWizardStep(String xml, String node) {
        Document d = toDoc(xml);
        WizardStepDto step = new WizardStepDto();
        Node root = xp(d, "//" + node).item(0);
        if (root == null) throw new RuntimeException("Wizard step not found");
        step.setSsd(attr(root, "ssd"));
        List<WizardParamDto> params = new ArrayList<>();
        NodeList groups = xp(d, "//" + node + "/group"); // некоторые каталоги группируют параметры
        if (groups.getLength() == 0) {
            // без групп – параметры сразу в <row> или <param>
            params.addAll(extractWizardParams(xp(d, "//" + node + "//param|//" + node + "//row")));
        } else {
            for (int i = 0; i < groups.getLength(); i++) {
                Node g = groups.item(i);
                params.addAll(extractWizardParams(g.getChildNodes()));
            }
        }
        step.setParams(params);
        // эвристика: если нет параметров -> финальный шаг (дальше FindVehicleByWizard2)
        step.setFinalStep(params.isEmpty());
        return step;
    }

    private static List<WizardParamDto> extractWizardParams(NodeList nl) {
        Map<String, WizardParamDto> map = new LinkedHashMap<>();
        for (int i = 0; i < nl.getLength(); i++) {
            Node n = nl.item(i);
            String nodeName = n.getNodeName().toLowerCase();
            if (!nodeName.equals("param") && !nodeName.equals("row")) continue;
            
            // Поддержка разных атрибутов для кода параметра
            String pcode = attr(n, "code");
            if (pcode == null) pcode = attr(n, "conditionid");
            if (pcode == null) continue;
            
            String plabel = attr(n, "name");
            
            WizardParamDto p = map.computeIfAbsent(pcode, k -> {
                WizardParamDto w = new WizardParamDto();
                w.setCode(k);
                w.setLabel(plabel);
                w.setValues(new ArrayList<>());
                return w;
            });
            
            // Обрабатываем опции внутри <options> элемента (Laximo структура)
            NodeList optionsChildNodes = n.getChildNodes();
            Node optionsNode = null;
            for (int j = 0; j < optionsChildNodes.getLength(); j++) {
                Node child = optionsChildNodes.item(j);
                if ("options".equalsIgnoreCase(child.getNodeName())) {
                    optionsNode = child;
                    break;
                }
            }
            
            if (optionsNode != null) {
                NodeList rowNodes = optionsNode.getChildNodes();
                for (int j = 0; j < rowNodes.getLength(); j++) {
                    Node rowNode = rowNodes.item(j);
                    if ("row".equalsIgnoreCase(rowNode.getNodeName())) {
                        WizardValueDto val = new WizardValueDto();
                        val.setCode(attr(rowNode, "key"));
                        val.setLabel(attr(rowNode, "value"));
                        p.getValues().add(val);
                    }
                }
            } else {
                // значения могут быть как дочерние <value code="X" name="..."/>
                NodeList values = n.getChildNodes();
                for (int j = 0; j < values.getLength(); j++) {
                    Node v = values.item(j);
                    if ("value".equalsIgnoreCase(v.getNodeName())) {
                        WizardValueDto val = new WizardValueDto();
                        val.setCode(attr(v, "code"));
                        val.setLabel(attr(v, "name") != null ? attr(v, "name") : v.getTextContent());
                        p.getValues().add(val);
                    }
                }
                // иногда значение единственное в атрибутах param/row
                if (p.getValues().isEmpty() && attr(n, "value") != null) {
                    WizardValueDto val = new WizardValueDto();
                    val.setCode(attr(n, "value"));
                    val.setLabel(attr(n, "name"));
                    p.getValues().add(val);
                }
            }
        }
        return new ArrayList<>(map.values());
    }

    // -------- Categories / Units / UnitInfo / Details / ImageMap / Filters --------
    public static List<CategoryDto> parseListCategories(String xml) {
        Document d = toDoc(xml);
        NodeList rows = xp(d, "//ListCategories/row");
        List<CategoryDto> res = new ArrayList<>();
        for (int i = 0; i < rows.getLength(); i++) {
            Node r = rows.item(i);
            CategoryDto c = new CategoryDto();
            c.setId(Long.parseLong(attr(r, "categoryid")));
            String parent = attr(r, "parentid");
            c.setParentId(parent == null || parent.isBlank() ? null : Long.parseLong(parent));
            c.setName(attr(r, "name"));
            c.setCode(attr(r, "code"));
            res.add(c);
        }
        return res;
    }

    public static List<UnitDto> parseListUnits(String xml) {
        Document d = toDoc(xml);
        NodeList rows = xp(d, "//ListUnits/row");
        List<UnitDto> res = new ArrayList<>();
        for (int i = 0; i < rows.getLength(); i++) {
            Node r = rows.item(i);
            UnitDto u = new UnitDto();
            u.setUnitId(Long.parseLong(attr(r, "unitid")));
            u.setName(attr(r, "name"));
            u.setCode(attr(r, "code"));
            u.setFiltered("true".equalsIgnoreCase(attr(r, "filter")));
            res.add(u);
        }
        return res;
    }

    public static UnitInfoDto parseUnitInfo(String xml) {
        Document d = toDoc(xml);
        Node r = xp(d, "//GetUnitInfo/row").item(0);
        if (r == null) throw new RuntimeException("Unit not found");
        UnitInfoDto u = new UnitInfoDto();
        String uid = attr(r, "unitid");
        if (uid != null) u.setUnitId(Long.parseLong(uid));
        u.setName(attr(r, "name"));
        u.setCode(attr(r, "code"));
        u.setImageUrl(attr(r, "imageurl"));
        NodeList attrs = xp(d, "//GetUnitInfo/row/attribute");
        for (int i = 0; i < attrs.getLength(); i++) {
            Node a = attrs.item(i);
            if ("note".equalsIgnoreCase(attr(a, "key")))
                u.setNote(attr(a, "value"));
        }
        return u;
    }

    public static List<DetailDto> parseDetails(String xml) {
        System.out.println("DEBUG parseDetails: Starting with XML length: " + xml.length());
        System.out.println("DEBUG parseDetails: First 1000 chars of XML:");
        System.out.println(xml.substring(0, Math.min(1000, xml.length())));
        
        Document d = toDoc(xml);
        // The correct element name is ListDetailsByUnit (with 's')
        NodeList rows = xp(d, "//ListDetailsByUnit/row");
        
        List<DetailDto> res = new ArrayList<>();
        for (int i = 0; i < rows.getLength(); i++) {
            Node r = rows.item(i);
            DetailDto dd = new DetailDto();
            
            // Basic attributes from row element that actually exist in XML
            String did = attr(r, "detailid");
            if (did != null) dd.setDetailId(Long.parseLong(did));
            dd.setOem(attr(r, "oem"));
            dd.setName(attr(r, "name"));
            dd.setCodeOnImage(attr(r, "codeonimage"));
            
            // Only extract fields that might actually exist in the XML
            // Based on debug output, these fields are NOT present as row attributes:
            // imageurl, largeimageurl, brand, price, weight, dimensions, etc.
            // We'll set these to null or default values and look for them elsewhere
            
            dd.setImageUrl(null); // Not available in this XML structure
            dd.setLargeImageUrl(null); // Not available in this XML structure  
            dd.setBrand(null); // Not available in this XML structure
            dd.setDescription(null); // Not available in this XML structure
            dd.setComponentCode(null); // Not available in this XML structure
            dd.setAlternativeOems(new ArrayList<>()); // Not available in this XML structure
            dd.setPrice(null); // Not available in this XML structure
            dd.setWeight(null); // Not available in this XML structure
            dd.setDimensions(null); // Not available in this XML structure
            dd.setMatch(null); // Not available in this XML structure
            dd.setUnitName(null); // Not available in this XML structure
            dd.setUnitCode(null); // Not available in this XML structure
            
            // Parse quantity from row attributes first
            String qty = attr(r, "qty");
            if (qty != null && !qty.isEmpty()) {
                try { 
                    dd.setQty(Integer.parseInt(qty)); 
                } catch (Exception ignore) {}
            }
            
            // Extract ssd for potential unit navigation
            String ssd = attr(r, "ssd");
            if (ssd != null) dd.setUnitSsd(ssd);
            
            // Parse nested attributes using XPath on the element
            NodeList attributes = ((Element) r).getElementsByTagName("attribute");
            Map<String, String> allAttrs = new HashMap<>();
            
            for (int j = 0; j < attributes.getLength(); j++) {
                Element attrElement = (Element) attributes.item(j);
                String key = attrElement.getAttribute("key");
                String value = attrElement.getAttribute("value");
                
                allAttrs.put(key, value);
                
                // Map specific attributes to DTO fields
                switch (key) {
                    case "amount":
                    case "quantity":
                        try { 
                            dd.setQty(Integer.parseInt(value)); 
                        } catch (Exception ignore) {}
                        break;
                    case "note":
                        dd.setNote(value);
                        break;
                    case "footnote":
                        dd.setFootnote(value);
                        break;
                    case "addnote":
                        dd.setAdditionalNote(value);
                        break;
                    case "replacedoem":
                        dd.setReplacedOem(value);
                        break;
                    case "link":
                        // Could be used for unit navigation
                        dd.setUnitCode(value);
                        break;
                }
            }
            
            dd.setAllAttributes(allAttrs);
            
            // Fallback for basic quantity if not found in attributes
            if (dd.getQty() == null || dd.getQty() == 0) {
                String qtyFallback = Optional.ofNullable(attr(r, "quantity")).orElse(attr(r, "qty"));
                if (qtyFallback != null && !qtyFallback.isBlank())
                    try { dd.setQty(Integer.parseInt(qtyFallback)); } catch (Exception ignore) {}
            }
            
            // Set applicability from note if available
            if (dd.getApplicability() == null) {
                dd.setApplicability(Optional.ofNullable(dd.getNote())
                        .orElse(attr(r, "applicability")));
            }
            
            res.add(dd);
        }
        return res;
    }

    public static List<ImageMapDto> parseImageMap(String xml) {
        Document d = toDoc(xml);
        NodeList rows = xp(d, "//ListImageMapByUnit/row");
        System.out.println("DEBUG parseImageMap: Found " + rows.getLength() + " ListImageMapByUnit rows");
        
        List<ImageMapDto> res = new ArrayList<>();
        for (int i = 0; i < rows.getLength(); i++) {
            Node r = rows.item(i);
            ImageMapDto m = new ImageMapDto();
            
            // Parse code as callout (номер на изображении)
            String code = attr(r, "code");
            m.setCallout(code);
            System.out.println("DEBUG parseImageMap: Processing code=" + code);
            
            // Parse coordinates from x1,y1,x2,y2 format
            String x1Str = attr(r, "x1");
            String y1Str = attr(r, "y1");
            String x2Str = attr(r, "x2");
            String y2Str = attr(r, "y2");
            
            System.out.println("DEBUG parseImageMap: Raw coords - x1=" + x1Str + " y1=" + y1Str + " x2=" + x2Str + " y2=" + y2Str);
            
            if (x1Str != null && y1Str != null && x2Str != null && y2Str != null) {
                try {
                    int x1 = Integer.parseInt(x1Str);
                    int y1 = Integer.parseInt(y1Str);
                    int x2 = Integer.parseInt(x2Str);
                    int y2 = Integer.parseInt(y2Str);
                    
                    // Convert to x,y,w,h format
                    m.setX(x1);
                    m.setY(y1);
                    m.setW(x2 - x1);  // width = x2 - x1
                    m.setH(y2 - y1);  // height = y2 - y1
                    
                    System.out.println("DEBUG parseImageMap: Converted to x=" + x1 + " y=" + y1 + " w=" + (x2-x1) + " h=" + (y2-y1));
                } catch (NumberFormatException e) {
                    System.out.println("DEBUG parseImageMap: Failed to parse coordinates: " + e.getMessage());
                    // Skip invalid coordinates
                    continue;
                }
            }
            
            // Set detailId if available
            String detailIdStr = attr(r, "detailid");
            if (detailIdStr != null) {
                try {
                    m.setDetailId(Long.parseLong(detailIdStr));
                } catch (NumberFormatException ignore) {}
            }
            
            res.add(m);
            System.out.println("DEBUG parseImageMap: Added ImageMapDto - code=" + m.getCallout() + " x=" + m.getX() + " y=" + m.getY());
        }
        return res;
    }

    public static List<FilterOptionDto> parseFilter(String xml, String nodeName) {
        Document d = toDoc(xml);
        NodeList rows = xp(d, "//" + nodeName + "//row|//" + nodeName + "//option|//" + nodeName + "//attribute");
        List<FilterOptionDto> res = new ArrayList<>();
        for (int i = 0; i < rows.getLength(); i++) {
            Node r = rows.item(i);
            FilterOptionDto f = new FilterOptionDto();
            f.setKey(Optional.ofNullable(attr(r, "key")).orElse(attr(r, "code")));
            f.setLabel(Optional.ofNullable(attr(r, "name")).orElse(attr(r, "label")));
            f.setValue(Optional.ofNullable(attr(r, "value")).orElse(attr(r, "val")));
            if (f.getKey() != null || f.getValue() != null || f.getLabel() != null) res.add(f);
        }
        return res;
    }

    // -------- Full-text details (FindDetail / FindDetailByNumber / FindDetailFullText) --------
    public static List<DetailDto> parseFulltextDetails(String xml) {
        Document d = toDoc(xml);

        // Поддержим разные имена корневых узлов для полнотекстового поиска (встречаются вариации)
        String[] roots = new String[] { "FindDetail", "FindDetailByNumber", "FindDetailFullText" };

        List<DetailDto> res = new ArrayList<>();
        for (String root : roots) {
            NodeList rows = xp(d, "//" + root + "/row");
            for (int i = 0; i < rows.getLength(); i++) {
                Node r = rows.item(i);
                DetailDto dd = new DetailDto();
                dd.setOem(attr(r, "oem"));
                dd.setName(attr(r, "name"));

                // Эти два поля полезны для витрины поиска:
                dd.setBrand(attr(r, "brand"));
                dd.setCatalog(attr(r, "catalog"));

                // qty/applicability — если сервер их присылает в fulltext
                String qty = Optional.ofNullable(attr(r, "quantity")).orElse(attr(r, "qty"));
                if (qty != null && !qty.isBlank()) {
                    try { dd.setQty(Integer.parseInt(qty)); } catch (Exception ignore) {}
                }
                dd.setApplicability(Optional.ofNullable(attr(r, "applicability"))
                        .orElse(attr(r, "note")));

                res.add(dd);
            }
            if (!res.isEmpty()) break; // если в одном из вариантов нашли — достаточно
        }
        return res;
    }

    // -------- OEM/Part references (FindPartReferences / FindDetailByNumber etc.) --------
    public static List<DetailDto> parseOemPartReferences(String xml) {
        if (xml == null || xml.isBlank()) return List.of();
        Document d = toDoc(xml);
        List<DetailDto> res = new ArrayList<>();

        // ВАРИАНТ 1: новая структура с <OEMPartReferences><OEMPartReference ...>
        NodeList refs = xp(d, "//OEMPartReferences/OEMPartReference");
        for (int i = 0; i < refs.getLength(); i++) {
            Node node = refs.item(i);
            if (!(node instanceof Element)) continue;
            Element ref = (Element) node;

            DetailDto dd = new DetailDto();
            dd.setOem(ref.getAttribute("oem"));

            // Имя детали — прямой потомок <name>
            String partName = null;
            NodeList children = ref.getChildNodes();
            for (int j = 0; j < children.getLength(); j++) {
                Node ch = children.item(j);
                if (ch.getNodeType() == Node.ELEMENT_NODE && "name".equalsIgnoreCase(ch.getNodeName())) {
                    partName = ch.getTextContent();
                    break;
                }
            }
            dd.setName(partName);

            // Первый CatalogReference под CatalogReferences
            Element catRef = null;
            for (int j = 0; j < children.getLength(); j++) {
                Node ch = children.item(j);
                if (ch.getNodeType() == Node.ELEMENT_NODE && "CatalogReferences".equals(ch.getNodeName())) {
                    NodeList crs = ch.getChildNodes();
                    for (int k = 0; k < crs.getLength(); k++) {
                        Node cr = crs.item(k);
                        if (cr.getNodeType() == Node.ELEMENT_NODE && "CatalogReference".equals(cr.getNodeName())) {
                            catRef = (Element) cr;
                            break;
                        }
                    }
                    break;
                }
            }
            if (catRef != null) {
                dd.setBrand(catRef.getAttribute("brand"));
                dd.setCatalog(catRef.getAttribute("code"));
            }

            if (dd.getOem() != null && !dd.getOem().isBlank()) {
                res.add(dd);
            }
        }
        if (!res.isEmpty()) return res;

        // ВАРИАНТ 2: старые ответы с <FindPartReferences>/<row>
        String[] roots = { "FindPartReferences", "FindDetailByNumber", "FindDetail", "FindDetailFullText" };
        for (String root : roots) {
            NodeList rows = xp(d, "//" + root + "/row");
            for (int i = 0; i < rows.getLength(); i++) {
                Node r = rows.item(i);
                DetailDto dd = new DetailDto();
                dd.setOem(attr(r, "oem"));
                dd.setName(attr(r, "name"));
                dd.setBrand(attr(r, "brand"));
                dd.setCatalog(attr(r, "catalog"));
                String qty = Optional.ofNullable(attr(r, "quantity")).orElse(attr(r, "qty"));
                if (qty != null && !qty.isBlank()) {
                    try { dd.setQty(Integer.parseInt(qty)); } catch (Exception ignore) {}
                }
                if (dd.getOem() != null && !dd.getOem().isBlank()) {
                    res.add(dd);
                }
            }
            if (!res.isEmpty()) break;
        }
        return res;
    }

    public static List<OemPartReferenceDto> parseOemPartReferencesDetailed(String xml) {
        if (xml == null || xml.isBlank()) return List.of();
        Document d = toDoc(xml);
        Map<String, OemPartReferenceDto> map = new LinkedHashMap<>();

        NodeList refs = xp(d, "//OEMPartReferences/OEMPartReference");
        for (int i = 0; i < refs.getLength(); i++) {
            Node node = refs.item(i);
            if (!(node instanceof Element)) continue;
            Element ref = (Element) node;
            String oem = ref.getAttribute("oem");
            if (oem == null || oem.isBlank()) continue;

            OemPartReferenceDto dto = map.computeIfAbsent(oem, k -> {
                OemPartReferenceDto created = new OemPartReferenceDto();
                created.setOem(k);
                return created;
            });

            if (dto.getName() == null || dto.getName().isBlank()) {
                NodeList children = ref.getChildNodes();
                for (int j = 0; j < children.getLength(); j++) {
                    Node child = children.item(j);
                    if (child.getNodeType() == Node.ELEMENT_NODE && "name".equalsIgnoreCase(child.getNodeName())) {
                        dto.setName(child.getTextContent());
                        break;
                    }
                }
            }

            NodeList children = ref.getChildNodes();
            for (int j = 0; j < children.getLength(); j++) {
                Node child = children.item(j);
                if (child.getNodeType() != Node.ELEMENT_NODE) continue;
                if (!"CatalogReferences".equals(child.getNodeName())) continue;

                NodeList catalogRefs = child.getChildNodes();
                for (int k = 0; k < catalogRefs.getLength(); k++) {
                    Node catalogNode = catalogRefs.item(k);
                    if (catalogNode.getNodeType() != Node.ELEMENT_NODE ||
                            !"CatalogReference".equals(catalogNode.getNodeName())) continue;

                    Element catalogEl = (Element) catalogNode;
                    String brand = catalogEl.getAttribute("brand");
                    String code = catalogEl.getAttribute("code");
                    String catalogName = null;

                    NodeList catChildren = catalogEl.getChildNodes();
                    for (int m = 0; m < catChildren.getLength(); m++) {
                        Node catChild = catChildren.item(m);
                        if (catChild.getNodeType() == Node.ELEMENT_NODE && "name".equalsIgnoreCase(catChild.getNodeName())) {
                            catalogName = catChild.getTextContent();
                            break;
                        }
                    }

                    appendCatalog(dto, brand, code, catalogName);
                }
            }
        }

        if (!map.isEmpty()) {
            return new ArrayList<>(map.values());
        }

        String[] roots = { "FindPartReferences", "FindDetailByNumber", "FindDetail", "FindDetailFullText" };
        for (String root : roots) {
            NodeList rows = xp(d, "//" + root + "/row");
            for (int i = 0; i < rows.getLength(); i++) {
                Node r = rows.item(i);
                String oem = attr(r, "oem");
                if (oem == null || oem.isBlank()) continue;

                OemPartReferenceDto dto = map.computeIfAbsent(oem, k -> {
                    OemPartReferenceDto created = new OemPartReferenceDto();
                    created.setOem(k);
                    return created;
                });

                if (dto.getName() == null || dto.getName().isBlank()) {
                    dto.setName(attr(r, "name"));
                }

                String brand = attr(r, "brand");
                String code = attr(r, "catalog");
                String catalogName = attr(r, "catalogname");
                appendCatalog(dto, brand, code, catalogName);
            }
        }

        return new ArrayList<>(map.values());
    }

    public static List<OemManufacturerDetailDto> parseFindOem(String xml) {
        if (xml == null || xml.isBlank()) return List.of();
        Document d = toDoc(xml);
        NodeList details = xp(d, "//FindOEM/detail");
        List<OemManufacturerDetailDto> result = new ArrayList<>();
        for (int i = 0; i < details.getLength(); i++) {
            Node node = details.item(i);
            if (!(node instanceof Element)) continue;
            Element detail = (Element) node;

            OemManufacturerDetailDto dto = new OemManufacturerDetailDto();
            dto.setDetailId(attr(detail, "detailid"));
            dto.setManufacturer(attr(detail, "manufacturer"));
            dto.setManufacturerId(attr(detail, "manufacturerid"));
            dto.setName(attr(detail, "name"));
            dto.setOem(attr(detail, "oem"));
            dto.setFormattedOem(attr(detail, "formattedoem"));
            dto.setWeight(attr(detail, "weight"));
            dto.setDimensions(attr(detail, "dimensions"));
            dto.setVolume(attr(detail, "volume"));

            List<OemReplacementDto> replacements = new ArrayList<>();
            NodeList childNodes = detail.getChildNodes();
            for (int j = 0; j < childNodes.getLength(); j++) {
                Node child = childNodes.item(j);
                if (child.getNodeType() != Node.ELEMENT_NODE) continue;
                if (!"replacements".equalsIgnoreCase(child.getNodeName())) continue;

                NodeList replacementNodes = child.getChildNodes();
                for (int k = 0; k < replacementNodes.getLength(); k++) {
                    Node repNode = replacementNodes.item(k);
                    if (repNode.getNodeType() != Node.ELEMENT_NODE || !"replacement".equalsIgnoreCase(repNode.getNodeName())) continue;
                    Element rep = (Element) repNode;

                    OemReplacementDto repDto = new OemReplacementDto();
                    repDto.setRate(parseInt(attr(rep, "rate")));
                    repDto.setType(attr(rep, "type"));
                    repDto.setWay(attr(rep, "way"));

                    NodeList repChildren = rep.getChildNodes();
                    for (int m = 0; m < repChildren.getLength(); m++) {
                        Node repChild = repChildren.item(m);
                        if (repChild.getNodeType() != Node.ELEMENT_NODE || !"detail".equalsIgnoreCase(repChild.getNodeName())) continue;
                        Element repDetail = (Element) repChild;
                        OemReplacementDetailDto rd = new OemReplacementDetailDto();
                        rd.setDetailId(attr(repDetail, "detailid"));
                        rd.setManufacturer(attr(repDetail, "manufacturer"));
                        rd.setManufacturerId(attr(repDetail, "manufacturerid"));
                        rd.setName(attr(repDetail, "name"));
                        rd.setOem(attr(repDetail, "oem"));
                        rd.setFormattedOem(attr(repDetail, "formattedoem"));
                        rd.setWeight(attr(repDetail, "weight"));
                        rd.setDimensions(attr(repDetail, "dimensions"));
                        rd.setVolume(attr(repDetail, "volume"));
                        repDto.setDetail(rd);
                        break;
                    }

                    replacements.add(repDto);
                }
            }
            dto.setReplacements(replacements);
            result.add(dto);
        }
        return result;
    }

    // CatXmlParser.java
    public static VehicleDto parseGetVehicleInfo(String xml) {
        return parseVehicleInfoLike(xml, "GetVehicleInfo");
    }

    private static VehicleDto parseVehicleInfoLike(String xml, String node) {
        Document d = toDoc(xml);
        Node r = xp(d, "//" + node + "/row").item(0);
        if (r == null) throw new RuntimeException(node + ": row not found");
        VehicleDto v = new VehicleDto();
        v.setVehicleId(attr(r, "vehicleid"));
        v.setSsd(attr(r, "ssd"));
        v.setCatalog(attr(r, "catalog"));
        v.setBrand(attr(r, "brand"));
        v.setName(attr(r, "name"));

        List<VehicleAttrDto> lst = new ArrayList<>();
        NodeList attrs = xp(d, "//" + node + "/row/attribute");
        for (int i = 0; i < attrs.getLength(); i++) {
            Node a = attrs.item(i);
            VehicleAttrDto dto = new VehicleAttrDto();
            dto.setCode(attr(a, "code"));
            dto.setLabel(attr(a, "name"));
            List<String> values = new ArrayList<>();
            NodeList vs = a.getChildNodes();
            for (int j = 0; j < vs.getLength(); j++) {
                Node ch = vs.item(j);
                if ("value".equalsIgnoreCase(ch.getNodeName())) values.add(ch.getTextContent());
            }
            dto.setValues(values);
            lst.add(dto);
        }
        v.setAttributes(lst);
        return v;
    }

    // CatXmlParser.java - Парсинг иерархических Quick Groups
    public static List<QuickGroupDto> parseQuickGroups(String xml) {
        Document d = toDoc(xml);
        List<QuickGroupDto> res = new ArrayList<>();
        
        // Находим корневые row элементы (прямые дети ListQuickGroups)
        // Попробуем разные варианты XPath
        NodeList rootRows = xp(d, "//ListQuickGroups/row");
        if (rootRows.getLength() == 0) {
            rootRows = xp(d, "/response/ListQuickGroups/row");
        }
        if (rootRows.getLength() == 0) {
            rootRows = xp(d, "//row[@quickgroupid]");
        }
        
        System.out.println("Найдено корневых групп: " + rootRows.getLength());
        
        for (int i = 0; i < rootRows.getLength(); i++) {
            Node row = rootRows.item(i);
            QuickGroupDto group = parseQuickGroupNodeRecursive(row);
            if (group != null) {
                res.add(group);
            }
        }
        
        System.out.println("Обработано групп: " + res.size());
        return res;
    }
    
    private static QuickGroupDto parseQuickGroupNodeRecursive(Node r) {
        if (r.getNodeType() != Node.ELEMENT_NODE || !"row".equals(r.getNodeName())) {
            return null;
        }
        
        QuickGroupDto g = new QuickGroupDto();
        
        // Пробуем разные варианты атрибутов для ID - сначала quickgroupid!
        String gid = attr(r, "quickgroupid");
        if (gid == null || gid.isBlank()) {
            gid = attr(r, "groupid");
        }
        if (gid == null || gid.isBlank()) {
            gid = attr(r, "id");
        }
        
        if (gid != null && !gid.isBlank()) {
            try {
                g.setId(Long.parseLong(gid));
            } catch (NumberFormatException e) {
                System.err.println("Не удается преобразовать ID '" + gid + "' в число для группы: " + attr(r, "name"));
                return null;
            }
        }
        
        g.setCode(attr(r, "code"));
        g.setName(attr(r, "name"));
        
        // Парсим дополнительные атрибуты
        String linkStr = attr(r, "link");
        if (linkStr != null && !linkStr.isBlank()) {
            g.setLink("true".equalsIgnoreCase(linkStr));
        }
        
        g.setSynonyms(attr(r, "synonyms"));
        
        // Проверяем, что имя не пустое
        if (g.getName() == null || g.getName().isBlank()) {
            return null;
        }
        
        // Рекурсивно обрабатываем дочерние row элементы
        NodeList childRows = getDirectChildrenByTagName(r, "row");
        for (int i = 0; i < childRows.getLength(); i++) {
            Node childRow = childRows.item(i);
            QuickGroupDto childGroup = parseQuickGroupNodeRecursive(childRow);
            if (childGroup != null) {
                g.getChildren().add(childGroup);
            }
        }
        
        System.out.println("Обработана группа: id=" + g.getId() + ", name='" + g.getName() + "', children=" + g.getChildren().size());
        return g;
    }
    
    // Вспомогательный метод для получения прямых дочерних элементов по имени тега
    private static NodeList getDirectChildrenByTagName(Node parent, String tagName) {
        List<Node> children = new ArrayList<>();
        NodeList allChildren = parent.getChildNodes();
        
        for (int i = 0; i < allChildren.getLength(); i++) {
            Node child = allChildren.item(i);
            if (child.getNodeType() == Node.ELEMENT_NODE && tagName.equals(child.getNodeName())) {
                children.add(child);
            }
        }
        
        return new NodeList() {
            @Override
            public Node item(int index) {
                return index < children.size() ? children.get(index) : null;
            }
            
            @Override
            public int getLength() {
                return children.size();
            }
        };
    }
    
    public static List<DetailDto> parseQuickDetails(String xml) {
        Document d = toDoc(xml);
        NodeList rows = xp(d, "//ListQuickDetail//Detail|//ListQuickDetails//Detail");
        List<DetailDto> res = new ArrayList<>();
        
        System.out.println("Найдено Detail элементов: " + rows.getLength());
        
        for (int i = 0; i < rows.getLength(); i++) {
            Node detailNode = rows.item(i);
            DetailDto dd = new DetailDto();
            
            // ========== ОСНОВНЫЕ АТРИБУТЫ ДЕТАЛИ ==========
            dd.setOem(attr(detailNode, "oem"));
            dd.setName(attr(detailNode, "name"));
            dd.setCatalog(attr(detailNode, "catalog"));
            dd.setBrand(attr(detailNode, "brand"));
            dd.setCodeOnImage(attr(detailNode, "codeonimage"));
            dd.setMatch(attr(detailNode, "match"));
            
            // ========== КОНТЕКСТ ОТ РОДИТЕЛЬСКИХ ЭЛЕМЕНТОВ ==========
            
            // Информация от Unit (родительский элемент)
            Node unitNode = detailNode.getParentNode();
            if (unitNode != null && "Unit".equals(unitNode.getNodeName())) {
                dd.setUnitName(attr(unitNode, "name"));
                dd.setUnitCode(attr(unitNode, "code"));
                dd.setUnitSsd(attr(unitNode, "ssd"));
                String unitIdStr = attr(unitNode, "unitid");
                if (unitIdStr != null) {
                    try { dd.setUnitId(Long.parseLong(unitIdStr)); } catch (Exception ignore) {}
                }
                
                // URLs изображений от Unit
                dd.setImageUrl(attr(unitNode, "imageurl"));
                dd.setLargeImageUrl(attr(unitNode, "largeimageurl"));
            }
            
            // Информация от Category (дедушка элемента)
            Node categoryNode = unitNode != null ? unitNode.getParentNode() : null;
            if (categoryNode != null && "Category".equals(categoryNode.getNodeName())) {
                dd.setCategoryName(attr(categoryNode, "name"));
                dd.setCategoryCode(attr(categoryNode, "code"));
                dd.setCategorySsd(attr(categoryNode, "ssd"));
                String categoryIdStr = attr(categoryNode, "categoryid");
                if (categoryIdStr != null) {
                    try { dd.setCategoryId(Long.parseLong(categoryIdStr)); } catch (Exception ignore) {}
                }
            }
            
            // ========== ИЗВЛЕЧЕНИЕ ВСЕХ АТРИБУТОВ ==========
            Map<String, String> allAttributes = new LinkedHashMap<>();
            List<String> alternativeOems = new ArrayList<>();
            List<String> images = new ArrayList<>();
            
            NodeList attributes = detailNode.getChildNodes();
            for (int j = 0; j < attributes.getLength(); j++) {
                Node attrNode = attributes.item(j);
                if ("attribute".equalsIgnoreCase(attrNode.getNodeName())) {
                    String key = attr(attrNode, "key");
                    String value = attr(attrNode, "value");
                    String name = attr(attrNode, "name");
                    
                    if (key != null && value != null) {
                        // Сохраняем все атрибуты
                        allAttributes.put(key, value);
                        
                        // Специальная обработка ключевых атрибутов
                        switch (key) {
                            case "amount":
                                try {
                                    dd.setQty(Integer.parseInt(value));
                                } catch (NumberFormatException ignore) {
                                    // Игнорируем нечисловые значения вроде "rq"
                                }
                                break;
                            case "note":
                                dd.setApplicability(value);
                                break;
                            case "addnote":
                                dd.setNote(value);
                                break;
                            case "footnote":
                                dd.setFootnote(value);
                                break;
                            case "replacedoem":
                                dd.setReplacedOem(value);
                                // Также добавляем в альтернативные OEM
                                if (!alternativeOems.contains(value)) {
                                    alternativeOems.add(value);
                                }
                                break;
                            case "componentcode":
                                dd.setComponentCode(value);
                                break;
                            case "price":
                                dd.setPrice(value);
                                break;
                            case "weight":
                                dd.setWeight(value);
                                break;
                            case "dimensions":
                                dd.setDimensions(value);
                                break;
                            case "description":
                                dd.setDescription(value);
                                break;
                            // Дополнительные типы заметок
                            case "additionalNote":
                            case "extra_note":
                                dd.setAdditionalNote(value);
                                break;
                            // Изображения
                            case "image":
                            case "imageurl":
                            case "imagepath":
                                if (!images.contains(value)) {
                                    images.add(value);
                                }
                                break;
                            // Альтернативные OEM номера
                            case "alternative_oem":
                            case "alt_oem":
                            case "oem_alt":
                                if (!alternativeOems.contains(value)) {
                                    alternativeOems.add(value);
                                }
                                break;
                        }
                        
                        System.out.println("  Атрибут: " + key + " = " + value + (name != null ? " (" + name + ")" : ""));
                    }
                }
            }
            
            // Устанавливаем собранные коллекции
            dd.setAllAttributes(allAttributes);
            if (!alternativeOems.isEmpty()) dd.setAlternativeOems(alternativeOems);
            if (!images.isEmpty()) dd.setImages(images);
            
            // Для отладки - сохраняем сырой XML элемента
            if (detailNode instanceof Element) {
                try {
                    dd.setRawXml(detailNode.toString().substring(0, Math.min(200, detailNode.toString().length())));
                } catch (Exception ignore) {}
            }
            
            // ========== ВАЛИДАЦИЯ И ДОБАВЛЕНИЕ ==========
            if (dd.getOem() != null && !dd.getOem().isBlank()) {
                res.add(dd);
                System.out.println("📦 Обработана деталь:");
                System.out.println("  OEM: " + dd.getOem());
                System.out.println("  Name: " + dd.getName());
                System.out.println("  Qty: " + dd.getQty());
                System.out.println("  ImageURL: " + dd.getImageUrl());
                System.out.println("  LargeImageURL: " + dd.getLargeImageUrl());
                System.out.println("  CodeOnImage: " + dd.getCodeOnImage());
                System.out.println("  Note: " + dd.getNote());
                System.out.println("  Footnote: " + (dd.getFootnote() != null && dd.getFootnote().length() > 50 ? 
                    dd.getFootnote().substring(0, 50) + "..." : dd.getFootnote()));
                System.out.println("  ReplacedOEM: " + dd.getReplacedOem());
                System.out.println("  ComponentCode: " + dd.getComponentCode());
                System.out.println("  UnitName: " + dd.getUnitName());
                System.out.println("  CategoryName: " + dd.getCategoryName());
                System.out.println("  Атрибутов всего: " + allAttributes.size());
                System.out.println("  ----");
            }
        }
        
        System.out.println("🎯 ИТОГО обработано деталей: " + res.size());
        return res;
    }


    public static List<ApplicableVehicleDto> parseFindApplicableVehicles(String xml) {
        var out = new ArrayList<ApplicableVehicleDto>();
        org.w3c.dom.Document d = toDoc(xml);
        var rows = d.getElementsByTagName("row");
        for (int i=0;i<rows.getLength();i++) {
            var e = (org.w3c.dom.Element) rows.item(i);
            ApplicableVehicleDto v = new ApplicableVehicleDto();
            v.setBrand(e.getAttribute("brand"));
            v.setCatalog(e.getAttribute("catalog"));
            v.setName(e.getAttribute("name"));
            v.setSsd(e.getAttribute("ssd"));
            v.setVehicleId(e.getAttribute("vehicleid"));
            // атрибуты (type=…)
            Map<String,String> attrs = new LinkedHashMap<>();
            var attrsNodes = e.getElementsByTagName("attribute");
            for (int j=0;j<attrsNodes.getLength();j++){
                var a = (org.w3c.dom.Element) attrsNodes.item(j);
                attrs.put(a.getAttribute("key"), a.getAttribute("value"));
            }
            v.setAttributes(attrs);
            out.add(v);
        }
        return out;
    }

    public static OemApplicabilityDto parseOemPartApplicability(String xml) {
        OemApplicabilityDto dto = new OemApplicabilityDto();
        org.w3c.dom.Document d = toDoc(xml);
        var cats = d.getElementsByTagName("Category");
        for (int i=0;i<cats.getLength();i++) {
            var ce = (org.w3c.dom.Element) cats.item(i);
            var c = new OemApplicabilityDto.Category();
            c.setCategoryId(Long.parseLong(ce.getAttribute("categoryid")));
            c.setName(ce.getAttribute("name"));
            c.setSsd(ce.getAttribute("ssd"));

            var units = ce.getElementsByTagName("Unit");
            for (int j=0;j<units.getLength();j++){
                var ue = (org.w3c.dom.Element) units.item(j);
                var u = new OemApplicabilityDto.Unit();
                u.setUnitId(Long.parseLong(ue.getAttribute("unitid")));
                u.setCode(ue.getAttribute("code"));
                u.setName(ue.getAttribute("name"));
                u.setImageUrl(ue.getAttribute("imageurl"));

                var dets = ue.getElementsByTagName("Detail");
                for (int k=0;k<dets.getLength();k++){
                    var de = (org.w3c.dom.Element) dets.item(k);
                    var dd = new OemApplicabilityDto.Detail();
                    dd.setOem(de.getAttribute("oem"));
                    dd.setName(de.getAttribute("name"));
                    dd.setCodeOnImage(de.getAttribute("codeonimage"));
                    // собрать <attribute .../>
                    Map<String,String> a = new LinkedHashMap<>();
                    var attrNodes = de.getElementsByTagName("attribute");
                    for (int m=0;m<attrNodes.getLength();m++){
                        var ae = (org.w3c.dom.Element) attrNodes.item(m);
                        a.put(ae.getAttribute("key"), ae.getAttribute("value"));
                    }
                    dd.setAttrs(a);
                    u.getDetails().add(dd);
                }
                c.getUnits().add(u);
            }
            dto.getCategories().add(c);
        }
        return dto;
    }



}

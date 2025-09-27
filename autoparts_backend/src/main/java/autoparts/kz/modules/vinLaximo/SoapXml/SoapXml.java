package autoparts.kz.modules.vinLaximo.SoapXml;


public class SoapXml {

    /** Достаёт <response>...</response> из SOAP-ответа Laximo (SOAP 1.1/1.2). */
    public static String sliceResponseXml(String soap) {
        if (soap == null) return null;

        // 1) Пробуем путь SOAP 1.2 (как у тебя сейчас): <return>...экранированный XML...</return>
        int rOpen = soap.indexOf("<return>");
        if (rOpen >= 0) {
            int rClose = soap.indexOf("</return>", rOpen);
            if (rClose > rOpen) {
                String inner = soap.substring(rOpen + "<return>".length(), rClose).trim();
                // На всякий случай срежем CDATA
                String xml = stripCdata(inner);
                // Снимаем HTML-экранирование (&lt;,&gt;,&quot;,&apos;,&amp;)
                xml = htmlUnescape(xml);
                // Выдёргиваем <response>...</response>
                String resp = extractResponse(xml);
                if (resp != null) return resp;
                // если не нашли, вернём как есть (возможно, уже чистый <response>)
                return xml;
            }
        }

        // 2) Fallback: вдруг сервер отдал не через <return>, а сразу <response> в SOAP-теле
        String resp = extractResponse(soap);
        if (resp != null) return resp;

        // 3) Ничего не нашли — вернём сырьё (для диагностики в логах)
        return soap;
    }

    private static String extractResponse(String s) {
        if (s == null) return null;
        int i = s.indexOf("<response");
        if (i < 0) return null;
        int j = s.lastIndexOf("</response>");
        if (j < 0 || j <= i) return null;
        return s.substring(i, j + "</response>".length());
    }

    private static String stripCdata(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.startsWith("<![CDATA[")) {
            int end = t.lastIndexOf("]]>");
            if (end > 0) return t.substring("<![CDATA[".length(), end);
        }
        return s;
    }

    /** Мини-декодер HTML-сущностей, которых нам хватает для Laximo. */
    private static String htmlUnescape(String s) {
        if (s == null) return null;
        // Важен порядок: сначала именованные, потом &amp;
        String t = s;
        t = t.replace("&lt;", "<");
        t = t.replace("&gt;", ">");
        t = t.replace("&quot;", "\"");
        t = t.replace("&apos;", "'");
        t = t.replace("&amp;", "&");
        return t;
    }
}

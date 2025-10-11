package autoparts.kz.modules.cml.util;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLOutputFactory;

public final class XmlUtils {

    private static final XMLInputFactory INPUT_FACTORY = XMLInputFactory.newFactory();
    private static final XMLOutputFactory OUTPUT_FACTORY = XMLOutputFactory.newFactory();

    static {
        INPUT_FACTORY.setProperty(XMLInputFactory.IS_COALESCING, true);
        INPUT_FACTORY.setProperty(XMLInputFactory.SUPPORT_DTD, false);
    }

    private XmlUtils() {
    }

    public static XMLInputFactory inputFactory() {
        return INPUT_FACTORY;
    }

    public static XMLOutputFactory outputFactory() {
        return OUTPUT_FACTORY;
    }
}

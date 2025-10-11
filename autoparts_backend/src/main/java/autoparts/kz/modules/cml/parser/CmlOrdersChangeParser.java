package autoparts.kz.modules.cml.parser;

import autoparts.kz.modules.cml.util.XmlUtils;

import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

@Component
public class CmlOrdersChangeParser {

    public record OrderChange(String guid,
                              String number,
                              String status,
                              boolean paid,
                              List<ReturnLine> returns) {
    }

    public record ReturnLine(String productGuid, BigDecimal quantity) {
    }

    public void parse(InputStream inputStream, Consumer<OrderChange> consumer) throws XMLStreamException {
        XMLStreamReader reader = XmlUtils.inputFactory().createXMLStreamReader(inputStream);
        try {
            while (reader.hasNext()) {
                int event = reader.next();
                if (event == XMLStreamConstants.START_ELEMENT && "Документ".equals(reader.getLocalName())) {
                    consumer.accept(parseDocument(reader));
                }
            }
        } finally {
            reader.close();
        }
    }

    private OrderChange parseDocument(XMLStreamReader reader) throws XMLStreamException {
        String guid = null;
        String number = null;
        String status = null;
        boolean paid = false;
        List<ReturnLine> returns = new ArrayList<>();
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT) {
                switch (reader.getLocalName()) {
                    case "Ид" -> guid = reader.getElementText().trim();
                    case "Номер" -> number = reader.getElementText().trim();
                    case "Статус" -> status = reader.getElementText().trim();
                    case "Оплачен" -> paid = "true".equalsIgnoreCase(reader.getElementText().trim()) ||
                            "да".equalsIgnoreCase(reader.getElementText().trim());
                    case "Товары" -> returns.addAll(parseReturns(reader));
                    default -> skip(reader);
                }
            } else if (event == XMLStreamConstants.END_ELEMENT && "Документ".equals(reader.getLocalName())) {
                break;
            }
        }
        return new OrderChange(guid, number, status, paid, returns);
    }

    private List<ReturnLine> parseReturns(XMLStreamReader reader) throws XMLStreamException {
        List<ReturnLine> returns = new ArrayList<>();
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT && "Товар".equals(reader.getLocalName())) {
                returns.add(parseReturnLine(reader));
            } else if (event == XMLStreamConstants.END_ELEMENT && "Товары".equals(reader.getLocalName())) {
                break;
            }
        }
        return returns;
    }

    private ReturnLine parseReturnLine(XMLStreamReader reader) throws XMLStreamException {
        String productGuid = null;
        BigDecimal quantity = BigDecimal.ZERO;
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT) {
                switch (reader.getLocalName()) {
                    case "Ид" -> productGuid = reader.getElementText().trim();
                    case "Количество" -> quantity = new BigDecimal(reader.getElementText().trim());
                    default -> skip(reader);
                }
            } else if (event == XMLStreamConstants.END_ELEMENT && "Товар".equals(reader.getLocalName())) {
                break;
            }
        }
        return new ReturnLine(productGuid, quantity);
    }

    private void skip(XMLStreamReader reader) throws XMLStreamException {
        int depth = 1;
        while (depth > 0 && reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT) {
                depth++;
            } else if (event == XMLStreamConstants.END_ELEMENT) {
                depth--;
            }
        }
    }
}

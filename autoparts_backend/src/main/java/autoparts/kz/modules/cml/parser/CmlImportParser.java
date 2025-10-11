package autoparts.kz.modules.cml.parser;

import autoparts.kz.modules.cml.util.XmlUtils;

import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;
import java.io.InputStream;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

@Component
public class CmlImportParser {

    public record ProductRecord(String guid,
                                String name,
                                String sku,
                                String description,
                                Long categoryId,
                                Map<String, String> attributes) {
    }

    public void parse(InputStream inputStream, int batchSize, Consumer<List<ProductRecord>> consumer) throws XMLStreamException {
        XMLStreamReader reader = XmlUtils.inputFactory().createXMLStreamReader(inputStream);
        List<ProductRecord> batch = new ArrayList<>(batchSize);
        try {
            while (reader.hasNext()) {
                int event = reader.next();
                if (event == XMLStreamConstants.START_ELEMENT && "Товар".equals(reader.getLocalName())) {
                    ProductRecord record = parseProduct(reader);
                    batch.add(record);
                    if (batch.size() >= batchSize) {
                        consumer.accept(List.copyOf(batch));
                        batch.clear();
                    }
                }
            }
            if (!batch.isEmpty()) {
                consumer.accept(List.copyOf(batch));
            }
        } finally {
            reader.close();
        }
    }

    private ProductRecord parseProduct(XMLStreamReader reader) throws XMLStreamException {
        String guid = null;
        String name = null;
        String sku = null;
        String description = null;
        Long categoryId = null;
        Map<String, String> attributes = new HashMap<>();
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT) {
                switch (reader.getLocalName()) {
                    case "Ид" -> {
                        if (guid == null) {
                            guid = text(reader);
                        } else {
                            skip(reader);
                        }
                    }
                    case "Артикул" -> sku = text(reader);
                    case "Наименование" -> name = text(reader);
                    case "Описание" -> description = text(reader);
                    case "Группы" -> categoryId = parseGroups(reader);
                    case "ЗначенияСвойств" -> attributes.putAll(parseAttributes(reader));
                    default -> skip(reader);
                }
            } else if (event == XMLStreamConstants.END_ELEMENT && "Товар".equals(reader.getLocalName())) {
                break;
            }
        }
        return new ProductRecord(guid, name, sku, description, categoryId, attributes);
    }

    private Long parseGroups(XMLStreamReader reader) throws XMLStreamException {
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT && "Ид".equals(reader.getLocalName())) {
                String text = text(reader);
                try {
                    return Long.parseLong(text.replaceAll("[^0-9]", ""));
                } catch (NumberFormatException ignored) {
                    return null;
                }
            } else if (event == XMLStreamConstants.END_ELEMENT && "Группы".equals(reader.getLocalName())) {
                break;
            }
        }
        return null;
    }

    private Map<String, String> parseAttributes(XMLStreamReader reader) throws XMLStreamException {
        Map<String, String> result = new HashMap<>();
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT && "ЗначенияСвойства".equals(reader.getLocalName())) {
                parseAttributeEntry(reader, result);
            } else if (event == XMLStreamConstants.END_ELEMENT && "ЗначенияСвойств".equals(reader.getLocalName())) {
                break;
            }
        }
        return result;
    }

    private void parseAttributeEntry(XMLStreamReader reader, Map<String, String> result) throws XMLStreamException {
        String key = null;
        String value = null;
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT) {
                switch (reader.getLocalName()) {
                    case "Ид" -> key = text(reader);
                    case "Значение" -> value = text(reader);
                    default -> skip(reader);
                }
            } else if (event == XMLStreamConstants.END_ELEMENT && "ЗначенияСвойства".equals(reader.getLocalName())) {
                if (key != null && value != null) {
                    result.put(key, value);
                }
                break;
            }
        }
    }

    private String text(XMLStreamReader reader) throws XMLStreamException {
        String text = reader.getElementText();
        return text != null ? text.trim() : null;
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

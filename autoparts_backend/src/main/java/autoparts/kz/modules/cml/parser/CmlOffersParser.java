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
public class CmlOffersParser {

    public record PriceRecord(String priceTypeGuid, BigDecimal value, String currency) {
    }

    public record WarehouseStock(String warehouseGuid, BigDecimal quantity) {
    }

    public record OfferRecord(String productGuid, BigDecimal totalQuantity, List<WarehouseStock> warehouses, List<PriceRecord> prices) {
    }

    public void parse(InputStream inputStream, int batchSize, Consumer<List<OfferRecord>> consumer) throws XMLStreamException {
        XMLStreamReader reader = XmlUtils.inputFactory().createXMLStreamReader(inputStream);
        List<OfferRecord> batch = new ArrayList<>(batchSize);
        try {
            while (reader.hasNext()) {
                int event = reader.next();
                if (event == XMLStreamConstants.START_ELEMENT && "Предложение".equals(reader.getLocalName())) {
                    OfferRecord record = parseOffer(reader);
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

    private OfferRecord parseOffer(XMLStreamReader reader) throws XMLStreamException {
        String guid = null;
        BigDecimal totalQuantity = BigDecimal.ZERO;
        List<WarehouseStock> warehouses = new ArrayList<>();
        List<PriceRecord> prices = new ArrayList<>();
        
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT) {
                switch (reader.getLocalName()) {
                    case "Ид" -> guid = reader.getElementText().trim();
                    case "Количество" -> totalQuantity = new BigDecimal(reader.getElementText().trim());
                    case "Цены" -> prices.addAll(parsePrices(reader));
                    case "Склад" -> {
                        // Читаем атрибуты ИдСклада и КоличествоНаСкладе
                        String warehouseId = reader.getAttributeValue(null, "ИдСклада");
                        String qtyStr = reader.getAttributeValue(null, "КоличествоНаСкладе");
                        if (warehouseId != null && qtyStr != null) {
                            try {
                                BigDecimal qty = new BigDecimal(qtyStr);
                                if (qty.compareTo(BigDecimal.ZERO) > 0) {
                                    warehouses.add(new WarehouseStock(warehouseId, qty));
                                }
                            } catch (NumberFormatException e) {
                                // Пропускаем невалидные количества
                            }
                        }
                    }
                    default -> skip(reader);
                }
            } else if (event == XMLStreamConstants.END_ELEMENT && "Предложение".equals(reader.getLocalName())) {
                break;
            }
        }
        return new OfferRecord(guid, totalQuantity, warehouses, prices);
    }

    private List<PriceRecord> parsePrices(XMLStreamReader reader) throws XMLStreamException {
        List<PriceRecord> prices = new ArrayList<>();
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT && "Цена".equals(reader.getLocalName())) {
                prices.add(parsePrice(reader));
            } else if (event == XMLStreamConstants.END_ELEMENT && "Цены".equals(reader.getLocalName())) {
                break;
            }
        }
        return prices;
    }

    private PriceRecord parsePrice(XMLStreamReader reader) throws XMLStreamException {
        String priceTypeGuid = null;
        BigDecimal value = BigDecimal.ZERO;
        String currency = "KZT";
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT) {
                switch (reader.getLocalName()) {
                    case "ИдТипаЦены" -> priceTypeGuid = reader.getElementText().trim();
                    case "ЦенаЗаЕдиницу" -> value = new BigDecimal(reader.getElementText().trim());
                    case "Валюта" -> currency = reader.getElementText().trim();
                    default -> skip(reader);
                }
            } else if (event == XMLStreamConstants.END_ELEMENT && "Цена".equals(reader.getLocalName())) {
                break;
            }
        }
        return new PriceRecord(priceTypeGuid, value, currency);
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

package autoparts.kz.modules.cml.builder;

import autoparts.kz.modules.cml.domain.entity.CmlOrder;
import autoparts.kz.modules.cml.domain.entity.CmlOrderItem;
import autoparts.kz.modules.cml.domain.entity.CmlOrderStatus;
import autoparts.kz.modules.cml.util.XmlUtils;
import org.springframework.stereotype.Component;

import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamWriter;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class OrdersCmlBuilder {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public byte[] build(List<CmlOrder> orders) throws XMLStreamException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        XMLStreamWriter writer = XmlUtils.outputFactory().createXMLStreamWriter(baos, StandardCharsets.UTF_8.name());
        writer.writeStartDocument(StandardCharsets.UTF_8.name(), "1.0");
        writer.writeStartElement("КоммерческаяИнформация");
        writer.writeAttribute("ВерсияСхемы", "2.10");
        writer.writeAttribute("ДатаФормирования", FORMATTER.format(java.time.LocalDateTime.now()));

        for (CmlOrder order : orders) {
            writeOrder(writer, order);
        }

        writer.writeEndElement(); // КоммерческаяИнформация
        writer.writeEndDocument();
        writer.flush();
        return baos.toByteArray();
    }

    private void writeOrder(XMLStreamWriter writer, CmlOrder order) throws XMLStreamException {
        writer.writeStartElement("Документ");

        element(writer, "Ид", order.getGuid());
        element(writer, "Номер", order.getNumber());
        if (order.getCreatedAt() != null) {
            element(writer, "Дата", order.getCreatedAt().toLocalDate().toString());
            element(writer, "Время", order.getCreatedAt().toLocalTime().toString());
        }
        element(writer, "Статус", mapStatus(order.getStatus()));
        element(writer, "Сумма", order.getTotal().toPlainString());
        element(writer, "Контрагент", order.getCustomerGuid());

        writer.writeStartElement("Товары");
        for (CmlOrderItem item : order.getItems()) {
            writeOrderItem(writer, item);
        }
        writer.writeEndElement(); // Товары

        writer.writeEndElement(); // Документ
    }

    private void writeOrderItem(XMLStreamWriter writer, CmlOrderItem item) throws XMLStreamException {
        writer.writeStartElement("Товар");
        element(writer, "Ид", item.getProductGuid());
        element(writer, "Цена", item.getPrice().toPlainString());
        element(writer, "Количество", item.getQty().toPlainString());
        element(writer, "Сумма", item.getSum().toPlainString());
        writer.writeEndElement();
    }

    private String mapStatus(CmlOrderStatus status) {
        return switch (status) {
            case NEW -> "Новый";
            case CONFIRMED -> "Подтвержден";
            case PAID -> "Оплачен";
            case SHIPPED -> "Отгружен";
            case COMPLETED -> "Завершен";
            case CANCELLED -> "Отменен";
            case RETURNED -> "Возврат";
        };
    }

    private void element(XMLStreamWriter writer, String name, String value) throws XMLStreamException {
        writer.writeStartElement(name);
        writer.writeCharacters(value != null ? value : "");
        writer.writeEndElement();
    }
}

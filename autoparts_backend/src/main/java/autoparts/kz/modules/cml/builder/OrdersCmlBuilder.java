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

        // Каждый заказ - это отдельный элемент <Документ>
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

        // Основные реквизиты
        element(writer, "Ид", order.getGuid());
        element(writer, "Номер", order.getNumber());
        element(writer, "ХозОперация", "Заказ товара");
        element(writer, "Роль", "Продавец");
        element(writer, "Валюта", "KZT");
        element(writer, "Курс", "1");
        
        if (order.getCreatedAt() != null) {
            element(writer, "Дата", order.getCreatedAt().toLocalDate().toString());
            element(writer, "Время", order.getCreatedAt().toLocalTime().toString());
        }
        
        // Контрагент
        writer.writeStartElement("Контрагенты");
        writer.writeStartElement("Контрагент");
        element(writer, "Ид", order.getCustomerGuid());
        element(writer, "Наименование", "Покупатель"); // TODO: можно добавить реальное имя из заказа
        element(writer, "Роль", "Покупатель");
        element(writer, "ПолноеНаименование", "Покупатель");
        writer.writeEndElement(); // Контрагент
        writer.writeEndElement(); // Контрагенты

        // Товары
        writer.writeStartElement("Товары");
        for (CmlOrderItem item : order.getItems()) {
            writeOrderItem(writer, item);
        }
        writer.writeEndElement(); // Товары

        // Значения реквизитов
        writer.writeStartElement("ЗначенияРеквизитов");
        
        writer.writeStartElement("ЗначениеРеквизита");
        element(writer, "Наименование", "Статус заказа");
        element(writer, "Значение", mapStatus(order.getStatus()));
        writer.writeEndElement();
        
        writer.writeStartElement("ЗначениеРеквизита");
        element(writer, "Наименование", "Номер версии");
        element(writer, "Значение", "1");
        writer.writeEndElement();
        
        writer.writeEndElement(); // ЗначенияРеквизитов

        // Сумма документа
        element(writer, "Сумма", order.getTotal().toPlainString());

        writer.writeEndElement(); // Документ
    }

    private void writeOrderItem(XMLStreamWriter writer, CmlOrderItem item) throws XMLStreamException {
        writer.writeStartElement("Товар");
        
        element(writer, "Ид", item.getProductGuid());
        element(writer, "Наименование", item.getProductName() != null ? item.getProductName() : "Товар");
        element(writer, "БазовыеЕдиницы", "шт");
        element(writer, "Артикул", item.getArticle() != null ? item.getArticle() : "");
        
        // Цена за единицу
        writer.writeStartElement("ЦенаЗаЕдиницу");
        element(writer, "Цена", item.getPrice().toPlainString());
        element(writer, "Валюта", "KZT");
        element(writer, "Единица", "шт");
        writer.writeEndElement(); // ЦенаЗаЕдиницу
        
        element(writer, "Количество", item.getQty().toPlainString());
        element(writer, "Сумма", item.getSum().toPlainString());
        
        // Скидки (если есть)
        writer.writeStartElement("Скидки");
        // Можно добавить скидки при необходимости
        writer.writeEndElement(); // Скидки
        
        // Реквизиты товара
        writer.writeStartElement("ЗначенияРеквизитов");
        writer.writeStartElement("ЗначениеРеквизита");
        element(writer, "Наименование", "ВидНоменклатуры");
        element(writer, "Значение", "Товар");
        writer.writeEndElement();
        
        writer.writeStartElement("ЗначениеРеквизита");
        element(writer, "Наименование", "ТипНоменклатуры");
        element(writer, "Значение", "Товар");
        writer.writeEndElement();
        writer.writeEndElement(); // ЗначенияРеквизитов
        
        writer.writeEndElement(); // Товар
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
    
    private String escapeXml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}

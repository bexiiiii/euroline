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
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm:ss");

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
            element(writer, "Дата", DATE_FORMAT.format(order.getCreatedAt()));
            element(writer, "Время", TIME_FORMAT.format(order.getCreatedAt()));
        }
        
        // Контрагент
        writer.writeStartElement("Контрагенты");
        writer.writeStartElement("Контрагент");
        element(writer, "Ид", order.getCustomerGuid());
        
        // Полное имя клиента
        String fullName = buildCustomerFullName(order);
        element(writer, "Наименование", fullName);
        element(writer, "ПолноеНаименование", fullName);
        element(writer, "Роль", "Покупатель");
        
        // Контактная информация
        if (order.getCustomerEmail() != null || order.getCustomerPhone() != null) {
            writer.writeStartElement("Контакты");
            
            if (order.getCustomerEmail() != null && !order.getCustomerEmail().isEmpty()) {
                writer.writeStartElement("Контакт");
                element(writer, "Тип", "Почта");
                element(writer, "Значение", order.getCustomerEmail());
                writer.writeEndElement(); // Контакт
            }
            
            if (order.getCustomerPhone() != null && !order.getCustomerPhone().isEmpty()) {
                writer.writeStartElement("Контакт");
                element(writer, "Тип", "Телефон");
                element(writer, "Значение", order.getCustomerPhone());
                writer.writeEndElement(); // Контакт
            }
            
            writer.writeEndElement(); // Контакты
        }
        
        // Адрес
        if (hasAddress(order)) {
            writer.writeStartElement("АдресРегистрации");
            writer.writeStartElement("Представление");
            writer.writeCharacters(buildAddressString(order));
            writer.writeEndElement(); // Представление
            
            if (order.getCustomerCountry() != null && !order.getCustomerCountry().isEmpty()) {
                element(writer, "Страна", order.getCustomerCountry());
            }
            if (order.getCustomerState() != null && !order.getCustomerState().isEmpty()) {
                element(writer, "Регион", order.getCustomerState());
            }
            if (order.getCustomerCity() != null && !order.getCustomerCity().isEmpty()) {
                element(writer, "Город", order.getCustomerCity());
            }
            if (order.getCustomerAddress() != null && !order.getCustomerAddress().isEmpty()) {
                element(writer, "АдресВСвободнойФорме", order.getCustomerAddress());
            }
            
            writer.writeEndElement(); // АдресРегистрации
        }

        writeCustomerRequisites(writer, order);
        
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
    
    private String buildCustomerFullName(CmlOrder order) {
        StringBuilder name = new StringBuilder();
        
        // Приоритет: название заведения, затем ФИО
        if (order.getCustomerClientName() != null && !order.getCustomerClientName().isEmpty()) {
            name.append(order.getCustomerClientName());
            
            // Если есть и ФИО, добавляем в скобках
            if (order.getCustomerName() != null && !order.getCustomerName().isEmpty()) {
                name.append(" (").append(order.getCustomerName()).append(")");
            }
        } else if (order.getCustomerName() != null && !order.getCustomerName().isEmpty()) {
            name.append(order.getCustomerName());
        } else if (order.getCustomerEmail() != null && !order.getCustomerEmail().isEmpty()) {
            name.append(order.getCustomerEmail());
        } else {
            name.append("Покупатель");
        }
        
        return name.toString();
    }
    
    private boolean hasAddress(CmlOrder order) {
        return isNotBlank(order.getCustomerCountry()) ||
               isNotBlank(order.getCustomerState()) ||
               isNotBlank(order.getCustomerCity()) ||
               isNotBlank(order.getCustomerAddress());
    }
    
    private String buildAddressString(CmlOrder order) {
        StringBuilder address = new StringBuilder();
        
        if (isNotBlank(order.getCustomerCountry())) {
            address.append(order.getCustomerCountry());
        }
        
        if (isNotBlank(order.getCustomerState())) {
            if (address.length() > 0) address.append(", ");
            address.append(order.getCustomerState());
        }
        
        if (isNotBlank(order.getCustomerCity())) {
            if (address.length() > 0) address.append(", ");
            address.append(order.getCustomerCity());
        }
        
        if (isNotBlank(order.getCustomerAddress())) {
            if (address.length() > 0) address.append(", ");
            address.append(order.getCustomerAddress());
        }

        if (isNotBlank(order.getCustomerOfficeAddress()) &&
                !order.getCustomerOfficeAddress().equals(order.getCustomerAddress())) {
            if (address.length() > 0) address.append(", ");
            address.append(order.getCustomerOfficeAddress());
        }
        
        return address.length() > 0 ? address.toString() : "Не указан";
    }

    private void writeCustomerRequisites(XMLStreamWriter writer, CmlOrder order) throws XMLStreamException {
        boolean hasData = isNotBlank(order.getCustomerLastName()) ||
                isNotBlank(order.getCustomerFirstName()) ||
                isNotBlank(order.getCustomerMiddleName()) ||
                isNotBlank(order.getCustomerType()) ||
                isNotBlank(order.getCustomerOfficeAddress()) ||
                order.getCustomerUserId() != null;

        if (!hasData) {
            return;
        }

        writer.writeStartElement("ЗначенияРеквизитов");

        writeRequisite(writer, "Фамилия", order.getCustomerLastName());
        writeRequisite(writer, "Имя", order.getCustomerFirstName());
        writeRequisite(writer, "Отчество", order.getCustomerMiddleName());
        writeRequisite(writer, "ТипКонтрагента", order.getCustomerType());
        writeRequisite(writer, "Адрес офиса", order.getCustomerOfficeAddress());
        if (order.getCustomerUserId() != null) {
            writeRequisite(writer, "ID клиента на сайте", order.getCustomerUserId().toString());
        }

        writer.writeEndElement(); // ЗначенияРеквизитов
    }

    private void writeRequisite(XMLStreamWriter writer, String name, String value) throws XMLStreamException {
        if (!isNotBlank(value)) {
            return;
        }
        writer.writeStartElement("ЗначениеРеквизита");
        element(writer, "Наименование", name);
        element(writer, "Значение", value);
        writer.writeEndElement();
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}

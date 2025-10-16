package autoparts.kz.modules.cml.xml;

import autoparts.kz.modules.finance.entity.RefundRequest;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.entity.OrderItem;
import autoparts.kz.modules.auth.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.StringWriter;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Генератор XML документов возврата для 1C в формате CommerceML 2.0
 */
@Component
@Slf4j
public class ReturnDocumentXmlGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    /**
     * Генерирует XML документ возврата для отправки в 1C
     * 
     * @param refundRequest Заявка на возврат
     * @param order Оригинальный заказ
     * @param orderItems Позиции заказа для возврата
     * @param client Клиент
     * @return XML строка в формате CommerceML 2.0
     */
    public String generateReturnDocument(RefundRequest refundRequest, Order order, 
                                        List<OrderItem> orderItems, User client) {
        try {
            StringWriter writer = new StringWriter();
            
            // Заголовок XML
            writer.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            writer.write("<КоммерческаяИнформация ВерсияСхемы=\"2.05\" ДатаФормирования=\"");
            writer.write(DATETIME_FORMATTER.format(refundRequest.getCreatedAt().atZone(ZoneId.systemDefault())));
            writer.write("\">\n");
            
            // Документ возврата
            writer.write("  <Документ>\n");
            writer.write("    <Ид>" + generateReturnId(refundRequest) + "</Ид>\n");
            writer.write("    <Номер>RET-" + refundRequest.getId() + "</Номер>\n");
            writer.write("    <Дата>" + DATE_FORMATTER.format(refundRequest.getCreatedAt().atZone(ZoneId.systemDefault())) + "</Дата>\n");
            writer.write("    <ХозОперация>Возврат товара</ХозОперация>\n");
            writer.write("    <Роль>Покупатель</Роль>\n");
            writer.write("    <Валюта>KZT</Валюта>\n");
            writer.write("    <Курс>1</Курс>\n");
            writer.write("    <Сумма>" + refundRequest.getAmount().toString() + "</Сумма>\n");
            
            // Связь с оригинальным заказом
            writer.write("    <ОснованиеДокумента>\n");
            writer.write("      <Ид>" + order.getExternalId() + "</Ид>\n");
            writer.write("      <Номер>" + order.getId() + "</Номер>\n");
            writer.write("      <Дата>" + DATE_FORMATTER.format(order.getCreatedAt().atZone(ZoneId.systemDefault())) + "</Дата>\n");
            writer.write("    </ОснованиеДокумента>\n");
            
            // Контрагент (клиент)
            writer.write("    <Контрагенты>\n");
            writer.write("      <Контрагент>\n");
            writer.write("        <Ид>CLIENT-" + client.getId() + "</Ид>\n");
            writer.write("        <Наименование>" + escapeXml(getClientName(client)) + "</Наименование>\n");
            writer.write("        <Роль>Покупатель</Роль>\n");
            
            if (client.getEmail() != null || client.getPhone() != null) {
                writer.write("        <Контакты>\n");
                if (client.getEmail() != null) {
                    writer.write("          <Контакт>\n");
                    writer.write("            <Тип>Почта</Тип>\n");
                    writer.write("            <Значение>" + escapeXml(client.getEmail()) + "</Значение>\n");
                    writer.write("          </Контакт>\n");
                }
                if (client.getPhone() != null) {
                    writer.write("          <Контакт>\n");
                    writer.write("            <Тип>Телефон</Тип>\n");
                    writer.write("            <Значение>" + escapeXml(client.getPhone()) + "</Значение>\n");
                    writer.write("          </Контакт>\n");
                }
                writer.write("        </Контакты>\n");
            }
            
            writer.write("      </Контрагент>\n");
            writer.write("    </Контрагенты>\n");
            
            // Товары для возврата
            writer.write("    <Товары>\n");
            for (OrderItem item : orderItems) {
                writer.write("      <Товар>\n");
                writer.write("        <Ид>PROD-" + item.getProduct().getId() + "</Ид>\n");
                writer.write("        <Наименование>" + escapeXml(item.getProduct().getName()) + "</Наименование>\n");
                
                if (item.getProduct().getSku() != null && !item.getProduct().getSku().isEmpty()) {
                    writer.write("        <Артикул>" + escapeXml(item.getProduct().getSku()) + "</Артикул>\n");
                }
                
                writer.write("        <БазоваяЕдиница>шт</БазоваяЕдиница>\n");
                writer.write("        <Количество>" + item.getQuantity() + "</Количество>\n");
                writer.write("        <ЦенаЗаЕдиницу>" + item.getPrice().toString() + "</ЦенаЗаЕдиницу>\n");
                writer.write("        <Сумма>" + item.getPrice().multiply(new java.math.BigDecimal(item.getQuantity())).toString() + "</Сумма>\n");
                writer.write("      </Товар>\n");
            }
            writer.write("    </Товары>\n");
            
            // Реквизиты документа
            writer.write("    <ЗначенияРеквизитов>\n");
            writer.write("      <ЗначениеРеквизита>\n");
            writer.write("        <Наименование>Статус возврата</Наименование>\n");
            writer.write("        <Значение>" + refundRequest.getStatus().name() + "</Значение>\n");
            writer.write("      </ЗначениеРеквизита>\n");
            
            if (refundRequest.getAdminComment() != null) {
                writer.write("      <ЗначениеРеквизита>\n");
                writer.write("        <Наименование>Комментарий администратора</Наименование>\n");
                writer.write("        <Значение>" + escapeXml(refundRequest.getAdminComment()) + "</Значение>\n");
                writer.write("      </ЗначениеРеквизита>\n");
            }
            
            writer.write("      <ЗначениеРеквизита>\n");
            writer.write("        <Наименование>Тип возврата</Наименование>\n");
            writer.write("        <Значение>Возврат через сайт</Значение>\n");
            writer.write("      </ЗначениеРеквизита>\n");
            writer.write("    </ЗначенияРеквизитов>\n");
            
            writer.write("  </Документ>\n");
            writer.write("</КоммерческаяИнформация>\n");
            
            return writer.toString();
            
        } catch (Exception e) {
            log.error("Ошибка генерации XML документа возврата: {}", e.getMessage(), e);
            throw new RuntimeException("Не удалось сгенерировать XML документ возврата", e);
        }
    }
    
    /**
     * Генерирует пакет возвратов для массовой отправки в 1C
     */
    public String generateReturnsPackage(List<RefundRequestWithDetails> returns) {
        try {
            StringWriter writer = new StringWriter();
            
            writer.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            writer.write("<КоммерческаяИнформация ВерсияСхемы=\"2.05\" ДатаФормирования=\"");
            writer.write(DATETIME_FORMATTER.format(java.time.Instant.now().atZone(ZoneId.systemDefault())));
            writer.write("\">\n");
            
            for (RefundRequestWithDetails returnData : returns) {
                String singleDoc = generateReturnDocument(
                    returnData.refundRequest,
                    returnData.order,
                    returnData.orderItems,
                    returnData.client
                );
                
                // Извлекаем только тег <Документ> из сгенерированного XML
                int startIdx = singleDoc.indexOf("<Документ>");
                int endIdx = singleDoc.indexOf("</Документ>") + "</Документ>".length();
                if (startIdx >= 0 && endIdx > startIdx) {
                    writer.write(singleDoc.substring(startIdx, endIdx));
                    writer.write("\n");
                }
            }
            
            writer.write("</КоммерческаяИнформация>\n");
            return writer.toString();
            
        } catch (Exception e) {
            log.error("Ошибка генерации пакета возвратов: {}", e.getMessage(), e);
            throw new RuntimeException("Не удалось сгенерировать пакет возвратов", e);
        }
    }
    
    private String generateReturnId(RefundRequest refund) {
        return "RETURN-" + refund.getId() + "-" + UUID.randomUUID().toString();
    }
    
    private String getClientName(User client) {
        // Собираем ФИО из surname, name, fathername
        String fullName = "";
        if (client.getSurname() != null && !client.getSurname().isEmpty()) {
            fullName += client.getSurname();
        }
        if (client.getName() != null && !client.getName().isEmpty()) {
            fullName += (fullName.isEmpty() ? "" : " ") + client.getName();
        }
        if (client.getFathername() != null && !client.getFathername().isEmpty()) {
            fullName += (fullName.isEmpty() ? "" : " ") + client.getFathername();
        }
        
        if (!fullName.isEmpty()) {
            return fullName;
        }
        
        if (client.getClientName() != null && !client.getClientName().isEmpty()) {
            return client.getClientName();
        }
        
        if (client.getEmail() != null) {
            return client.getEmail();
        }
        
        return "Клиент #" + client.getId();
    }
    
    private String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&apos;");
    }
    
    /**
     * DTO для передачи данных возврата с деталями
     */
    public static class RefundRequestWithDetails {
        public final RefundRequest refundRequest;
        public final Order order;
        public final List<OrderItem> orderItems;
        public final User client;
        
        public RefundRequestWithDetails(RefundRequest refundRequest, Order order, 
                                       List<OrderItem> orderItems, User client) {
            this.refundRequest = refundRequest;
            this.order = order;
            this.orderItems = orderItems;
            this.client = client;
        }
    }
}

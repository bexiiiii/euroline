package autoparts.kz.modules.cml.builder;

import autoparts.kz.modules.cml.domain.entity.CmlOrder;
import autoparts.kz.modules.cml.domain.entity.CmlOrderItem;
import autoparts.kz.modules.cml.domain.entity.CmlOrderStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OrdersCmlBuilderTest {

    private final OrdersCmlBuilder builder = new OrdersCmlBuilder();

    @Test
    void shouldBuildValidCommerceML() throws Exception {
        // Подготовка данных
        CmlOrder order = new CmlOrder();
        order.setGuid("order-guid-123");
        order.setNumber("ORD-001");
        order.setCustomerGuid("customer-guid-456");
        order.setCustomerName("Иванов Иван Иванович");
        order.setCustomerClientName("ТОО \"АвтоСервис Алматы\"");
        order.setCustomerFirstName("Иван");
        order.setCustomerLastName("Иванов");
        order.setCustomerMiddleName("Иванович");
        order.setCustomerType("Юридическое лицо");
        order.setCustomerEmail("ivanov@example.com");
        order.setCustomerPhone("+77001234567");
        order.setCustomerCountry("Казахстан");
        order.setCustomerCity("Алматы");
        order.setCustomerState("Алматинская область");
        order.setCustomerOfficeAddress("БЦ «Nomad», офис 501");
        order.setCustomerUserId(42L);
        order.setCustomerAddress("ул. Абая, д. 10, офис 5");
        order.setStatus(CmlOrderStatus.NEW);
        order.setTotal(new BigDecimal("15000.00"));
        order.setCreatedAt(LocalDateTime.of(2025, 10, 27, 10, 30));

        CmlOrderItem item1 = new CmlOrderItem();
        item1.setProductGuid("product-guid-1");
        item1.setProductName("Масло моторное 5W-30");
        item1.setArticle("OIL-5W30-001");
        item1.setPrice(new BigDecimal("5000.00"));
        item1.setQty(new BigDecimal("2"));
        item1.setSum(new BigDecimal("10000.00"));
        item1.setOrder(order);

        CmlOrderItem item2 = new CmlOrderItem();
        item2.setProductGuid("product-guid-2");
        item2.setProductName("Фильтр масляный");
        item2.setArticle("FILTER-001");
        item2.setPrice(new BigDecimal("2500.00"));
        item2.setQty(new BigDecimal("2"));
        item2.setSum(new BigDecimal("5000.00"));
        item2.setOrder(order);

        List<CmlOrderItem> items = new ArrayList<>();
        items.add(item1);
        items.add(item2);
        order.setItems(items);

        // Генерация XML
        byte[] xml = builder.build(List.of(order));
        String xmlString = new String(xml, StandardCharsets.UTF_8);

        System.out.println("Generated XML:");
        System.out.println(xmlString);

        // Проверка структуры
        assertThat(xmlString).contains("<?xml version");
        assertThat(xmlString).contains("encoding");
        assertThat(xmlString).contains("UTF-8");
        assertThat(xmlString).contains("<КоммерческаяИнформация");
        assertThat(xmlString).contains("ВерсияСхемы=\"2.10\"");
        assertThat(xmlString).contains("ДатаФормирования=");
        
        // Проверка документа
        assertThat(xmlString).contains("<Документ>");
        assertThat(xmlString).contains("<Ид>order-guid-123</Ид>");
        assertThat(xmlString).contains("<Номер>ORD-001</Номер>");
        assertThat(xmlString).contains("<ХозОперация>Заказ товара</ХозОперация>");
        assertThat(xmlString).contains("<Роль>Продавец</Роль>");
        assertThat(xmlString).contains("<Валюта>KZT</Валюта>");
        assertThat(xmlString).contains("<Курс>1</Курс>");
        assertThat(xmlString).contains("<Дата>2025-10-27</Дата>");
        assertThat(xmlString).contains("<Время>10:30");
        
        // Проверка контрагента
        assertThat(xmlString).contains("<Контрагенты>");
        assertThat(xmlString).contains("<Контрагент>");
        assertThat(xmlString).contains("<Ид>customer-guid-456</Ид>");
        assertThat(xmlString).contains("ТОО \"АвтоСервис Алматы\"");
        assertThat(xmlString).contains("Иванов Иван Иванович");
        assertThat(xmlString).contains("<Роль>Покупатель</Роль>");
        
        // Проверка контактов
        assertThat(xmlString).contains("<Контакты>");
        assertThat(xmlString).contains("<Контакт>");
        assertThat(xmlString).contains("<Тип>Почта</Тип>");
        assertThat(xmlString).contains("<Значение>ivanov@example.com</Значение>");
        assertThat(xmlString).contains("<Тип>Телефон</Тип>");
        assertThat(xmlString).contains("<Значение>+77001234567</Значение>");
        
        // Проверка адреса
        assertThat(xmlString).contains("<АдресРегистрации>");
        assertThat(xmlString).contains("<Представление>Казахстан, Алматинская область, Алматы, ул. Абая, д. 10, офис 5, БЦ «Nomad», офис 501</Представление>");
        assertThat(xmlString).contains("<Страна>Казахстан</Страна>");
        assertThat(xmlString).contains("<Регион>Алматинская область</Регион>");
        assertThat(xmlString).contains("<Город>Алматы</Город>");
        assertThat(xmlString).contains("<АдресВСвободнойФорме>ул. Абая, д. 10, офис 5</АдресВСвободнойФорме>");
        
        // Проверка дополнительных реквизитов клиента
        assertThat(xmlString).contains("<Наименование>Фамилия</Наименование>");
        assertThat(xmlString).contains("<Значение>Иванов</Значение>");
        assertThat(xmlString).contains("<Наименование>Имя</Наименование>");
        assertThat(xmlString).contains("<Значение>Иван</Значение>");
        assertThat(xmlString).contains("Отчество");
        assertThat(xmlString).contains("Иванович");
        assertThat(xmlString).contains("ТипКонтрагента");
        assertThat(xmlString).contains("Юридическое лицо");
        assertThat(xmlString).contains("ID клиента на сайте");
        assertThat(xmlString).contains("42");
        
        // Проверка товаров
        assertThat(xmlString).contains("<Товары>");
        assertThat(xmlString).contains("<Наименование>Масло моторное 5W-30</Наименование>");
        assertThat(xmlString).contains("<Артикул>OIL-5W30-001</Артикул>");
        assertThat(xmlString).contains("<Наименование>Фильтр масляный</Наименование>");
        assertThat(xmlString).contains("<Артикул>FILTER-001</Артикул>");
        assertThat(xmlString).contains("<ЦенаЗаЕдиницу>");
        assertThat(xmlString).contains("<Количество>2</Количество>");
        
        // Проверка реквизитов
        assertThat(xmlString).contains("<ЗначенияРеквизитов>");
        assertThat(xmlString).contains("<Наименование>Статус заказа</Наименование>");
        assertThat(xmlString).contains("<Значение>Новый</Значение>");
        
        // Проверка суммы
        assertThat(xmlString).contains("<Сумма>15000.00</Сумма>");
        
        // Проверка закрывающих тегов
        assertThat(xmlString).contains("</Документ>");
        assertThat(xmlString).contains("</КоммерческаяИнформация>");
    }

    @Test
    void shouldHandleMultipleOrders() throws Exception {
        CmlOrder order1 = new CmlOrder();
        order1.setGuid("order-1");
        order1.setNumber("001");
        order1.setCustomerGuid("customer-1");
        order1.setStatus(CmlOrderStatus.NEW);
        order1.setTotal(new BigDecimal("1000"));
        order1.setCreatedAt(LocalDateTime.now());
        order1.setItems(new ArrayList<>());

        CmlOrder order2 = new CmlOrder();
        order2.setGuid("order-2");
        order2.setNumber("002");
        order2.setCustomerGuid("customer-2");
        order2.setStatus(CmlOrderStatus.CONFIRMED);
        order2.setTotal(new BigDecimal("2000"));
        order2.setCreatedAt(LocalDateTime.now());
        order2.setItems(new ArrayList<>());

        byte[] xml = builder.build(List.of(order1, order2));
        String xmlString = new String(xml, StandardCharsets.UTF_8);

        // Должно быть два документа
        assertThat(xmlString.split("<Документ>").length - 1).isEqualTo(2);
        assertThat(xmlString).contains("<Ид>order-1</Ид>");
        assertThat(xmlString).contains("<Ид>order-2</Ид>");
        assertThat(xmlString).contains("<Номер>001</Номер>");
        assertThat(xmlString).contains("<Номер>002</Номер>");
    }
}

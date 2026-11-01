package autoparts.kz.modules.onecOrders;

import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.entity.OrderItem;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class OneCOrderCommandMapperTest {
    private final ObjectMapper json = new ObjectMapper();
    private final OneCOrderProperties config = new OneCOrderProperties();
    private final OneCOrderCommandMapper mapper = new OneCOrderCommandMapper(json, config);

    private Order order() {
        config.setOrganizationRefKey(UUID.randomUUID().toString());
        config.setWarehouseRefKey(UUID.randomUUID().toString());
        Order order = new Order();
        order.setId(4L);
        order.setPublicCode("U0HT3");
        order.setStatus(OrderStatus.PENDING);
        order.setCustomerEmail("buyer@example.test");
        order.setComment("Customer instruction");
        User user = new User(); user.setId(4L); user.setClientName("Buyer"); order.setUser(user);
        Product product = new Product(); product.setOneCRefKey(UUID.randomUUID().toString());
        OrderItem item = new OrderItem(); item.setProduct(product); item.setQuantity(6);
        item.setPrice(new BigDecimal("4000.00"));
        item.setWarehouseRefKey(UUID.randomUUID().toString());
        order.setItems(List.of(item));
        return order;
    }

    @Test void preservesOrderIdentityPricesCustomerAndSelectedWarehouse() throws Exception {
        var order = order(); String id = UUID.randomUUID().toString();
        var command = json.readTree(mapper.create(id, order));
        assertThat(command.path("commandId").asText()).isEqualTo(id);
        assertThat(command.path("data").path("siteOrderId").asText()).isEqualTo(order.getExternalId());
        assertThat(command.path("data").path("warehouseRefKey").asText()).isEqualTo(order.getItems().get(0).getWarehouseRefKey());
        assertThat(command.path("data").path("customer").path("id").asText()).isEqualTo("4");
        assertThat(command.path("data").has("counterpartyRefKey")).isFalse();
        assertThat(command.path("data").path("items").get(0).path("price").decimalValue()).isEqualByComparingTo("4000.00");
        assertThat(command.path("data").path("comment").asText()).contains("U0HT3", "Customer instruction");
    }

    @Test void rejectsCancelledOrderAndProductsWithoutOneCIdentity() {
        var order = order(); order.setStatus(OrderStatus.CANCELLED);
        assertThatThrownBy(() -> mapper.create(UUID.randomUUID().toString(), order)).hasMessageContaining("Cancelled");
        order.setStatus(OrderStatus.PENDING); order.getItems().get(0).getProduct().setOneCRefKey(null);
        assertThatThrownBy(() -> mapper.create(UUID.randomUUID().toString(), order)).hasMessageContaining("productRefKey");
    }

    @Test void neverSilentlyChangesWarehouseForMixedWarehouseOrder() {
        var order = order(); var other = new OrderItem();
        other.setProduct(order.getItems().get(0).getProduct()); other.setQuantity(1); other.setPrice(BigDecimal.ZERO);
        other.setWarehouseRefKey(UUID.randomUUID().toString());
        order.setItems(List.of(order.getItems().get(0), other));
        assertThatThrownBy(() -> mapper.create(UUID.randomUUID().toString(), order)).hasMessageContaining("multiple warehouses");
    }

    @Test void usesConfiguredWarehouseOnlyWhenTheOrderHasNoSelection() throws Exception {
        var order = order(); order.getItems().get(0).setWarehouseRefKey(null);
        assertThat(json.readTree(mapper.create(UUID.randomUUID().toString(), order)).path("data").path("warehouseRefKey").asText())
                .isEqualTo(config.getWarehouseRefKey());
    }
}

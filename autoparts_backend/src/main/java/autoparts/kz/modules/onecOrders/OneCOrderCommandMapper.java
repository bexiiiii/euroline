package autoparts.kz.modules.onecOrders;

import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.orderStatus.OrderStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OneCOrderCommandMapper {
    private final ObjectMapper json;
    private final OneCOrderProperties properties;

    public String create(String commandId, Order order) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cancelled order cannot be exported as a new order");
        }
        ObjectNode command = json.createObjectNode();
        command.put("commandId", uuid(commandId, "commandId"));
        command.put("type", "order.create");
        ObjectNode data = command.putObject("data");
        data.put("siteOrderId", uuid(order.getExternalId(), "siteOrderId"));
        data.put("siteOrderNumber", order.getPublicCode());
        data.put("organizationRefKey", uuid(properties.getOrganizationRefKey(), "organizationRefKey"));
        String comment = "Website order #" + order.getPublicCode();
        if (order.getComment() != null && !order.getComment().isBlank()) comment += "\n" + order.getComment();
        if (order.getDeliveryAddress() != null && !order.getDeliveryAddress().isBlank()) {
            comment += "\nDelivery: " + order.getDeliveryAddress();
        }
        data.put("comment", comment);
        var user = order.getUser();
        if (user == null || user.getId() == null) throw new IllegalArgumentException("Order has no customer");
        ObjectNode customer = data.putObject("customer");
        customer.put("id", user.getId().toString());
        customer.put("clientName", user.getClientName());
        customer.put("surname", user.getSurname());
        customer.put("name", user.getName());
        customer.put("fathername", user.getFathername());
        customer.put("phone", user.getPhone());
        customer.put("email", order.getCustomerEmail());
        customer.put("companyType", user.getType());
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order has no items");
        }
        var warehouses = new LinkedHashSet<String>();
        var items = data.putArray("items");
        for (var item : order.getItems()) {
            if (item.getProduct() == null) throw new IllegalArgumentException("Order item has no product");
            if (item.getQuantity() <= 0 || item.getPrice() == null || item.getPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Invalid order item quantity or price");
            }
            String warehouse = item.getWarehouseRefKey();
            if (warehouse == null || warehouse.isBlank()) warehouse = properties.getWarehouseRefKey();
            warehouses.add(uuid(warehouse, "warehouseRefKey"));
            ObjectNode row = items.addObject();
            row.put("productRefKey", uuid(item.getProduct().getOneCRefKey(), "productRefKey"));
            row.put("quantity", item.getQuantity());
            row.put("price", item.getPrice());
        }
        // The installed 1C API accepts a warehouse on the document, not on each item.
        if (warehouses.size() != 1) throw new IllegalArgumentException("1C API cannot import multiple warehouses in one order");
        data.put("warehouseRefKey", warehouses.iterator().next());
        return command.toString();
    }

    static String uuid(String value, String field) {
        try {
            String normalized = UUID.fromString(value).toString();
            if (!normalized.equalsIgnoreCase(value) || normalized.equals("00000000-0000-0000-0000-000000000000")) {
                throw new IllegalArgumentException();
            }
            return normalized;
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("Missing or invalid " + field);
        }
    }
}

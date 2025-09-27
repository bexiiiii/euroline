package autoparts.kz.modules.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateOrderRequest {
    /** Адрес доставки, попадёт в заказ и уйдёт в 1С */
    @NotBlank(message = "Адрес доставки не может быть пустым")
    @Size(max = 500, message = "Адрес доставки не может быть длиннее 500 символов")
    private String deliveryAddress;

    /** Идемпотентный ключ от клиента (например, UUID при нажатии "Оплатить") */
    @NotBlank(message = "Ключ идемпотентности не может быть пустым")
    @Size(max = 255, message = "Ключ идемпотентности не может быть длиннее 255 символов")
    private String idempotencyKey;
}

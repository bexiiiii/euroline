package autoparts.kz.modules.telegram.service;

import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.returns.entity.ReturnRequest;
import autoparts.kz.modules.finance.entity.TopUp;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramNotificationService {

    private final TelegramBot telegramBot;
    private final UserRepository userRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    /**
     * Уведомление о новом заказе
     */
    public void notifyNewOrder(Order order) {
        try {
            StringBuilder message = new StringBuilder();
            message.append("🛒 *Новый заказ!*\n\n");
            message.append("📝 Номер заказа: `").append(order.getPublicCode()).append("`\n");
            message.append("💰 Сумма: *").append(formatMoney(order.getTotalPrice())).append("*\n");
            message.append("📧 Email: ").append(order.getCustomerEmail()).append("\n");
            message.append("📍 Адрес: ").append(order.getDeliveryAddress() != null ? order.getDeliveryAddress() : "не указан").append("\n");
            message.append("📦 Статус: ").append(getStatusEmoji(order.getStatus().toString())).append(" ").append(order.getStatus()).append("\n");
            message.append("🕐 Дата: ").append(order.getCreatedAt().format(DATE_FORMATTER)).append("\n\n");
            
            // Добавляем информацию о товарах
            message.append("*Товары:*\n");
            order.getItems().forEach(item -> {
                message.append("• ").append(item.getProduct().getName())
                       .append(" x").append(item.getQuantity())
                       .append(" - ").append(formatMoney(item.getPrice()))
                       .append("\n");
            });

            telegramBot.sendMessageToAdmin(message.toString());
            log.info("Notification sent for new order: {}", order.getPublicCode());
        } catch (Exception e) {
            log.error("Failed to send order notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Уведомление о запросе на возврат
     */
    public void notifyReturnRequest(ReturnRequest returnRequest) {
        try {
            StringBuilder message = new StringBuilder();
            message.append("🔄 *Запрос на возврат!*\n\n");
            message.append("📝 ID возврата: `").append(returnRequest.getId()).append("`\n");
            message.append("🛒 ID заказа: `").append(returnRequest.getOrderId()).append("`\n");
            
            // Получаем имя клиента
            String clientName = getClientName(returnRequest.getCustomerId());
            message.append("👤 Клиент: *").append(clientName).append("*\n");
            
            message.append("💰 Сумма возврата: *").append(formatMoney(returnRequest.getAmount())).append("*\n");
            message.append("❓ Причина: ").append(returnRequest.getReason()).append("\n");
            message.append("📦 Статус: ").append(getReturnStatusEmoji(returnRequest.getStatus().toString())).append(" ").append(returnRequest.getStatus()).append("\n");
            
            LocalDateTime createdAt = LocalDateTime.ofInstant(returnRequest.getCreatedAt(), ZoneId.systemDefault());
            message.append("🕐 Дата запроса: ").append(createdAt.format(DATE_FORMATTER)).append("\n");

            telegramBot.sendMessageToAdmin(message.toString());
            log.info("Notification sent for return request: {}", returnRequest.getId());
        } catch (Exception e) {
            log.error("Failed to send return request notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Уведомление о пополнении счета
     */
    public void notifyBalanceTopUp(TopUp topUp) {
        try {
            StringBuilder message = new StringBuilder();
            message.append("💳 *Пополнение счета!*\n\n");
            message.append("📝 ID пополнения: `").append(topUp.getId()).append("`\n");
            message.append("💰 Сумма: *").append(formatMoney(topUp.getAmount())).append("*\n");
            
            // Получаем имя клиента
            String clientName = getClientName(topUp.getClientId());
            message.append("👤 Клиент: *").append(clientName).append("*\n");
            
            message.append("📊 Статус: ").append(getTopUpStatusEmoji(topUp.getStatus().toString())).append(" ").append(topUp.getStatus()).append("\n");
            
            if (topUp.getPaymentMethod() != null) {
                message.append("💳 Способ оплаты: ").append(topUp.getPaymentMethod()).append("\n");
            }
            
            if (topUp.getAdminComment() != null) {
                message.append("💬 Комментарий: ").append(topUp.getAdminComment()).append("\n");
            }
            
            LocalDateTime createdAt = LocalDateTime.ofInstant(topUp.getCreatedAt(), ZoneId.systemDefault());
            message.append("🕐 Дата: ").append(createdAt.format(DATE_FORMATTER)).append("\n");

            if (topUp.getReceiptUrl() != null) {
                message.append("\n📄 Чек: ").append(topUp.getReceiptUrl());
            }

            telegramBot.sendMessageToAdmin(message.toString());
            log.info("Notification sent for balance top-up: {}", topUp.getId());
        } catch (Exception e) {
            log.error("Failed to send balance top-up notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Получить имя клиента (компании) или fallback
     */
    private String getClientName(Long clientId) {
        if (clientId == null) {
            return "Неизвестный клиент";
        }
        
        try {
            User user = userRepository.findById(clientId).orElse(null);
            if (user == null) {
                return "Клиент #" + clientId;
            }
            
            // Приоритет: clientName (название компании), затем ФИО, затем email
            if (user.getClientName() != null && !user.getClientName().isBlank()) {
                return user.getClientName();
            }
            
            // Собираем ФИО
            StringBuilder name = new StringBuilder();
            if (user.getSurname() != null && !user.getSurname().isBlank()) {
                name.append(user.getSurname());
            }
            if (user.getName() != null && !user.getName().isBlank()) {
                if (name.length() > 0) name.append(" ");
                name.append(user.getName());
            }
            if (user.getFathername() != null && !user.getFathername().isBlank()) {
                if (name.length() > 0) name.append(" ");
                name.append(user.getFathername());
            }
            
            if (name.length() > 0) {
                return name.toString();
            }
            
            // Используем email как последний вариант
            if (user.getEmail() != null && !user.getEmail().isBlank()) {
                return user.getEmail();
            }
            
            return "Клиент #" + clientId;
        } catch (Exception e) {
            log.error("Error fetching client name for ID {}: {}", clientId, e.getMessage());
            return "Клиент #" + clientId;
        }
    }

    /**
     * Форматирование денежной суммы
     */
    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0 ₸";
        return String.format("%,.2f ₸", amount);
    }

    /**
     * Получить эмодзи для статуса заказа
     */
    private String getStatusEmoji(String status) {
        return switch (status.toUpperCase()) {
            case "PENDING" -> "⏳";
            case "CONFIRMED" -> "✅";
            case "PROCESSING" -> "🔄";
            case "SHIPPED" -> "🚚";
            case "DELIVERED" -> "📦";
            case "CANCELLED", "CANCELED" -> "❌";
            case "COMPLETED" -> "✅";
            default -> "📋";
        };
    }

    /**
     * Получить эмодзи для статуса возврата
     */
    private String getReturnStatusEmoji(String status) {
        return switch (status.toUpperCase()) {
            case "PENDING" -> "⏳";
            case "APPROVED" -> "✅";
            case "REJECTED" -> "❌";
            case "COMPLETED" -> "✅";
            case "REFUNDED" -> "💰";
            default -> "📋";
        };
    }

    /**
     * Получить эмодзи для статуса транзакции/пополнения
     */
    private String getTopUpStatusEmoji(String status) {
        return switch (status.toUpperCase()) {
            case "PENDING" -> "⏳";
            case "APPROVED" -> "✅";
            case "REJECTED" -> "❌";
            default -> "📋";
        };
    }

    /**
     * Отправить произвольное уведомление администратору
     */
    public void notifyAdmin(String title, String message) {
        try {
            String formattedMessage = String.format("*%s*\n\n%s", title, message);
            telegramBot.sendMessageToAdmin(formattedMessage);
            log.info("Custom notification sent: {}", title);
        } catch (Exception e) {
            log.error("Failed to send custom notification: {}", e.getMessage(), e);
        }
    }
}

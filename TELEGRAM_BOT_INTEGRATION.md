# Telegram Bot Integration for Admin Notifications

## Overview
This document describes the Telegram bot integration that sends notifications to the admin about important business events: new orders, return requests, and balance top-ups.

## Configuration

### Bot Details
- **Bot Token**: `8250208628:AAEvjencS7ffYxD-KmSIFFqORCLWU0BHI4A`
- **Bot Username**: `euroline_autoparts_bot`
- **Admin Chat ID**: `6322824405`

### Application Configuration
Configuration is stored in `application.yml`:

```yaml
telegram:
  bot:
    token: 8250208628:AAEvjencS7ffYxD-KmSIFFqORCLWU0BHI4A
    username: euroline_autoparts_bot
    admin-chat-id: 6322824405
```

## Dependencies

Added to `pom.xml`:

```xml
<dependency>
    <groupId>org.telegram</groupId>
    <artifactId>telegrambots</artifactId>
    <version>6.8.0</version>
</dependency>
<dependency>
    <groupId>org.telegram</groupId>
    <artifactId>telegrambots-spring-boot-starter</artifactId>
    <version>6.8.0</version>
</dependency>
```

## Architecture

### Module Structure
```
autoparts_backend/src/main/java/autoparts/kz/modules/telegram/
├── config/
│   └── TelegramBotConfig.java       # Configuration properties
└── service/
    ├── TelegramBot.java              # Bot implementation (long polling)
    └── TelegramNotificationService.java  # Notification formatting & sending
```

### Components

#### 1. TelegramBotConfig.java
Configuration class that reads bot settings from `application.yml`:
- `token`: Bot authentication token
- `username`: Bot username
- `adminChatId`: Admin's Telegram chat ID for notifications

#### 2. TelegramBot.java
Main bot implementation using long polling:
- Extends `TelegramLongPollingBot`
- Handles incoming messages from users
- Provides methods to send messages:
  - `sendMessage(String chatId, String text)`: Send to any chat
  - `sendMessageToAdmin(String text)`: Send to admin chat

#### 3. TelegramNotificationService.java
Service for formatting and sending business event notifications:
- `notifyNewOrder(Order order)`: Sends notification about new orders
- `notifyReturnRequest(ReturnRequest returnRequest)`: Sends notification about return requests with client name
- `notifyBalanceTopUp(TopUp topUp)`: Sends notification about balance top-ups with client name
- `getClientName(Long clientId)`: Helper method to resolve client name with priority:
  1. Company name (`clientName` field)
  2. Full name (surname + name + fathername)
  3. Email
  4. Fallback to "Клиент #ID"

## Integration Points

### 1. Order Creation
**File**: `OrderService.java`

When a new order is created, the bot sends a notification with:
- 📦 Order emoji
- Order public code (e.g., `#ORD-1234`)
- Customer email
- Delivery address
- Total amount
- Creation timestamp

### 2. Return Requests
**File**: `ReturnService.java`

Notifications are sent in two scenarios:
1. **New Return Request** (in `create()` method):
   - When customer submits a new return request
   
2. **Status Change** (in `patch()` method):
   - When admin updates the return request status

Notification includes:
- 🔄 Return emoji
- Return request ID
- Associated order ID
- **Client name** (company name from `clientName`, or full name, or email)
- Return amount
- Current status
- Return reason
- Creation timestamp

### 3. Balance Top-Ups
**File**: `FinanceService.java`

Notifications are sent in two scenarios:
1. **New Top-Up Request** (in `createTopUp()` method):
   - When customer requests a balance top-up
   
2. **Status Change** (in `patchTopUp()` method):
   - When admin approves/rejects the top-up request

Notification includes:
- 💰 Money emoji
- Top-up ID
- **Client name** (company name from `clientName`, or full name, or email)
- Amount
- Current status
- Payment method (if provided)
- Receipt URL (if uploaded)
- Creation timestamp

## Message Format Examples

### New Order Notification
```
📦 Новый заказ!

Заказ: #ORD-1234
Клиент: customer@example.com
Адрес: г. Алматы, ул. Абая 123
Сумма: 45000.00 ₸
Дата: 2024-01-15 14:30:25
```

### Return Request Notification
```
🔄 Запрос на возврат

ID: 42
Клиент: ТОО "Евролайн Авто"
Заказ: 1234
Сумма: 15000.00 ₸
Статус: NEW
Причина: Товар не подошел
Дата: 2024-01-15 15:45:10
```

### Balance Top-Up Notification
```
💰 Заявка на пополнение

ID: 78
Клиент: ТОО "Евролайн Авто"
Сумма: 50000.00 ₸
Статус: PENDING
Метод: Kaspi Transfer
Чек: https://example.com/receipt.jpg
Дата: 2024-01-15 16:20:35
```

## Error Handling

All notification calls are wrapped in try-catch blocks to ensure that:
- Telegram API failures don't interrupt business logic
- Orders, returns, and top-ups are processed successfully even if notification fails
- Errors are logged for debugging (can be added in catch blocks)

Example:
```java
try {
    telegramNotificationService.notifyNewOrder(order);
} catch (Exception ex) {
    // Logged but doesn't interrupt order creation
}
```

## Deployment Steps

### 1. Build the Project
```bash
cd /Users/behruztohtamishov/euroline/autoparts_backend
mvn clean install
```

### 2. Restart the Application
Restart your Spring Boot application to load the new Telegram bot dependencies and initialize the bot.

### 3. Verify Bot Connection
After restart, the bot should:
- Connect to Telegram API using long polling
- Be ready to receive messages at `@euroline_autoparts_bot`
- Start sending notifications to admin chat ID `6322824405`

### 4. Test Notifications
Create test events to verify notifications:
1. **Test Order**: Create a new order via API or admin panel
2. **Test Return**: Submit a return request
3. **Test Top-Up**: Request a balance top-up

Check that notifications appear in the admin's Telegram chat.

## Future Enhancements

Potential improvements:
1. **Rich Formatting**: Use Telegram's MarkdownV2 or HTML formatting for better readability
2. **Interactive Buttons**: Add inline keyboards for quick actions (approve/reject)
3. **Multiple Admins**: Support notifying multiple admin accounts
4. **Notification Preferences**: Allow admins to configure which events to receive
5. **Logging**: Add comprehensive logging for debugging notification issues
6. **Retry Logic**: Implement automatic retries for failed notifications
7. **Statistics**: Track notification delivery success rates

## Troubleshooting

### Bot Not Sending Messages
1. Verify bot token is correct in `application.yml`
2. Check that admin chat ID is correct (6322824605)
3. Ensure admin has initiated a conversation with the bot (send `/start` to @euroline_autoparts_bot)
4. Check application logs for Telegram API errors

### Dependencies Not Found
1. Run `mvn clean install` to download dependencies
2. Verify Maven can access central repository
3. Check that Telegram bot version 6.8.0 is available

### Compilation Errors
1. Ensure all required entity fields exist (Order, ReturnRequest, TopUp)
2. Verify Spring Boot version compatibility with Telegram bots library
3. Check that all imports are correct

## Security Considerations

1. **Bot Token**: Keep the bot token secret, don't commit to public repositories
2. **Chat ID**: Only authorized admin chat IDs should receive sensitive business information
3. **Data Exposure**: Be mindful of what data is sent via Telegram (consider masking sensitive info)
4. **Access Control**: Ensure only the bot can send messages to admin chat

## References

- [Telegram Bots API Documentation](https://core.telegram.org/bots/api)
- [TelegramBots Java Library](https://github.com/rubenlagus/TelegramBots)
- [Spring Boot Integration Guide](https://github.com/rubenlagus/TelegramBots/wiki/Spring-Boot)

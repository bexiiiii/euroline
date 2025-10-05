package autoparts.kz.modules.telegram.service;

import autoparts.kz.modules.telegram.config.TelegramBotConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

@Slf4j
@Component
public class TelegramBot extends TelegramLongPollingBot {

    private final TelegramBotConfig config;

    public TelegramBot(TelegramBotConfig config) {
        super(config.getToken());
        this.config = config;
    }

    @Override
    public String getBotUsername() {
        return config.getUsername();
    }

    @Override
    public void onUpdateReceived(Update update) {
        // Обработка входящих сообщений (если нужно)
        if (update.hasMessage() && update.getMessage().hasText()) {
            String messageText = update.getMessage().getText();
            Long chatId = update.getMessage().getChatId();
            
            log.info("Received message from chat {}: {}", chatId, messageText);
            
            // Можно добавить команды для бота
            if (messageText.equals("/start")) {
                sendMessage(chatId, "Добро пожаловать! Этот бот используется для уведомлений о заказах.");
            } else if (messageText.equals("/mychatid")) {
                sendMessage(chatId, "Ваш Chat ID: " + chatId);
            }
        }
    }

    /**
     * Отправить сообщение в указанный чат
     */
    public void sendMessage(Long chatId, String text) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId.toString());
        message.setText(text);
        message.enableMarkdown(true);
        
        try {
            execute(message);
            log.info("Message sent to chat {}", chatId);
        } catch (TelegramApiException e) {
            log.error("Failed to send message to chat {}: {}", chatId, e.getMessage());
        }
    }

    /**
     * Отправить сообщение администратору
     */
    public void sendMessageToAdmin(String text) {
        try {
            Long adminChatId = Long.parseLong(config.getAdminChatId());
            sendMessage(adminChatId, text);
        } catch (NumberFormatException e) {
            log.error("Invalid admin chat ID: {}", config.getAdminChatId());
        }
    }
}

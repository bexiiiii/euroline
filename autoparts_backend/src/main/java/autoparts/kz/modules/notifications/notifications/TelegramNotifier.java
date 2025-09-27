package autoparts.kz.modules.notifications.notifications;

import autoparts.kz.modules.admin.settings.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;


@Component
@RequiredArgsConstructor
public class TelegramNotifier implements Notifier {

    private final SettingsService settings;
    private final WebClient webClient = WebClient.create();

    @Override
    public void notify(String subject, String message) {
        String token = settings.get("telegram.bot.token", null);
        String chatIdsCsv = settings.get("telegram.chat.ids", null); // можно несколько ID через запятую
        if (token == null || chatIdsCsv == null) {
            System.out.println("[TELEGRAM DISABLED] Missing token/chat ids");
            return;
        }
        String text = "*" + escape(subject) + "*\n" + escape(message);
        for (String chatId : chatIdsCsv.split(",")) {
            sendMessage(token.trim(), chatId.trim(), text);
        }
    }

    private void sendMessage(String token, String chatId, String text) {
        String url = "https://api.telegram.org/bot" + token + "/sendMessage";
        webClient.post().uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("""
                        {"chat_id":"%s","text":"%s","parse_mode":"Markdown"}
                        """.formatted(chatId, text))
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(err -> System.out.println("[TELEGRAM ERROR] " + err.getMessage()))
                .subscribe(r -> System.out.println("[TELEGRAM OK] " + r));
    }

    private String escape(String s) {
        return s.replace("_","\\_").replace("*","\\*").replace("[","\\[").replace("]","\\]");
    }
}

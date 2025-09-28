package autoparts.kz.modules.admin.Events.service;

import autoparts.kz.modules.admin.Events.entity.EventLog;
import autoparts.kz.modules.admin.Events.repository.EventLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class EventLogService {
    
    private final EventLogRepository eventLogRepository;

    public void logEvent(String eventType, String description) {
        logEvent(eventType, null, null, null, description, null, true, null);
    }

    public void logEvent(String eventType, String description, boolean success) {
        logEvent(eventType, null, null, null, description, null, success, null);
    }

    public void logEvent(String eventType, String entityType, Long entityId, String description) {
        logEvent(eventType, entityType, entityId, null, description, null, true, null);
    }

    public void logEvent(String eventType, String entityType, Long entityId, Long userId, String description, String details, boolean success, String errorMessage) {
        try {
            EventLog eventLog = new EventLog();
            eventLog.setEventType(eventType);
            eventLog.setEntityType(entityType);
            eventLog.setEntityId(entityId);
            eventLog.setUserId(userId);
            
            // Try to get user name from security context or session
            if (userId != null) {
                eventLog.setUserName("user" + userId);
            } else {
                eventLog.setUserName("Система");
            }
            
            eventLog.setDescription(description);
            eventLog.setDetails(details);
            eventLog.setSuccess(success);
            eventLog.setErrorMessage(errorMessage);
            eventLog.setCreatedAt(Instant.now());
            
            // Get request info if available
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                eventLog.setIpAddress(getClientIpAddress(request));
                eventLog.setUserAgent(request.getHeader("User-Agent"));
                eventLog.setSessionId(request.getSession().getId());
            }
            
            eventLogRepository.save(eventLog);
        } catch (Exception e) {
            // Don't let logging failures break the main functionality
            System.err.println("Failed to log event: " + e.getMessage());
        }
    }

    public void logUserLogin(Long userId, String username) {
        logEvent("USER_LOGIN", "USER", userId, userId, 
                "Пользователь " + username + " вошел в систему", 
                "Успешная аутентификация через веб-интерфейс", true, null);
    }

    public void logUserLogout(Long userId, String username) {
        logEvent("USER_LOGOUT", "USER", userId, userId, 
                "Пользователь " + username + " вышел из системы", 
                null, true, null);
    }

    public void logAdminAction(String action, String details) {
        logEvent("ADMIN_ACTION", "ADMIN", null, null, 
                "Административное действие: " + action, details, true, null);
    }

    public void logSettingsUpdate(String settingKey, String oldValue, String newValue) {
        logEvent("SETTINGS_UPDATED", "SYSTEM", null, null, 
                "Обновлена настройка: " + settingKey, 
                "Старое значение: " + oldValue + " → Новое значение: " + newValue, true, null);
    }

    public void logSystemRestart() {
        logEvent("SYSTEM_RESTART", "SYSTEM", null, null, 
                "Система перезапущена", 
                "Перезапуск инициирован через админ-панель", true, null);
    }

    public void logSystemBackup() {
        logEvent("SYSTEM_BACKUP", "SYSTEM", null, null, 
                "Создана резервная копия системы", 
                "Автоматическое резервное копирование базы данных", true, null);
    }

    public void logApiKeyCreated(Long apiKeyId, String keyName) {
        logEvent("API_KEY_CREATED", "API", apiKeyId, null, 
                "Создан API ключ: " + keyName, 
                "Новый API ключ для внешних интеграций", true, null);
    }

    public void logApiKeyRevoked(Long apiKeyId, String keyName) {
        logEvent("API_KEY_REVOKED", "API", apiKeyId, null, 
                "Отозван API ключ: " + keyName, 
                "API ключ деактивирован", true, null);
    }

    public void logError(String errorType, String errorMessage, String details) {
        logEvent("ERROR_OCCURRED", "SYSTEM", null, null, 
                "Системная ошибка: " + errorType, details, false, errorMessage);
    }

    public void logSecurityEvent(String eventDescription, String details) {
        logEvent("SECURITY_EVENT", "SECURITY", null, null, 
                "Событие безопасности: " + eventDescription, details, true, null);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
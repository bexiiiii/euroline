package autoparts.kz.modules.admin.Events.aspect;

import autoparts.kz.modules.admin.Events.service.EventLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminActionLoggingAspect {
    
    private final EventLogService eventLogService;

    @AfterReturning("execution(* autoparts.kz.modules.admin.*.controller.*.*(..))")
    public void logAdminAction(JoinPoint joinPoint) {
        try {
            String className = joinPoint.getTarget().getClass().getSimpleName();
            String methodName = joinPoint.getSignature().getName();
            
            // Skip logging for GET methods (read operations) to avoid spam
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String method = request.getMethod();
                
                if ("GET".equals(method)) {
                    return; // Don't log read operations
                }
                
                String actionDescription = generateActionDescription(className, methodName, method);
                if (actionDescription != null) {
                    eventLogService.logAdminAction(actionDescription, 
                        String.format("Контроллер: %s, Метод: %s, HTTP: %s", className, methodName, method));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to log admin action: {}", e.getMessage());
        }
    }
    
    private String generateActionDescription(String className, String methodName, String httpMethod) {
        // Generate meaningful descriptions based on controller and method names
        switch (className) {
            case "AdminSettingsController":
                if ("put".equals(methodName) || "POST".equals(httpMethod)) {
                    return "Обновлены системные настройки";
                }
                break;
            case "AdminApiKeysController":
                if ("create".equals(methodName)) {
                    return "Создан новый API ключ";
                } else if ("revoke".equals(methodName) || "DELETE".equals(httpMethod)) {
                    return "API ключ отозван";
                }
                break;
            case "AdminSystemController":
                if ("restart".equals(methodName)) {
                    return "Инициирован перезапуск системы";
                } else if ("backup".equals(methodName)) {
                    return "Запущено создание резервной копии";
                }
                break;
            case "EventController":
                if ("clear".equals(methodName) || "DELETE".equals(httpMethod)) {
                    return "Очищены логи событий";
                } else if ("createTestRealEvent".equals(methodName)) {
                    return "Создано тестовое событие";
                }
                break;
            default:
                // For other controllers, generate generic description
                if ("POST".equals(httpMethod)) {
                    return "Создание записи через " + className;
                } else if ("PUT".equals(httpMethod) || "PATCH".equals(httpMethod)) {
                    return "Обновление данных через " + className;
                } else if ("DELETE".equals(httpMethod)) {
                    return "Удаление данных через " + className;
                }
        }
        return null; // Don't log if no meaningful description can be generated
    }
}
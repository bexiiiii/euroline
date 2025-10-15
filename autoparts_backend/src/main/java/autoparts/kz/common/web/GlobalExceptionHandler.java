
package autoparts.kz.common.web;

import autoparts.kz.integration.umapi.exception.UmapiApiException;
import autoparts.kz.integration.umapi.exception.UmapiConnectionException;
import autoparts.kz.integration.umapi.exception.UmapiException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import jakarta.validation.ConstraintViolationException;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> onValidation(ConstraintViolationException e) {
        return Map.of("error", "validation_error", "message", e.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> onTypeMismatch(MethodArgumentTypeMismatchException e) {
        return Map.of("error", "bad_request", "message", e.getMessage());
    }

    // ========== UMAPI Exception Handlers ==========
    
    @ExceptionHandler(UmapiConnectionException.class)
    public ResponseEntity<Map<String, Object>> onUmapiConnection(UmapiConnectionException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                Map.of(
                        "error", "umapi_connection_error",
                        "message", "Не удалось подключиться к UMAPI: " + e.getMessage()
                )
        );
    }

    @ExceptionHandler(UmapiApiException.class)
    public ResponseEntity<Map<String, Object>> onUmapiApi(UmapiApiException e) {
        HttpStatus status = e.getStatusCode() >= 500 
                ? HttpStatus.BAD_GATEWAY 
                : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(
                Map.of(
                        "error", "umapi_api_error",
                        "message", e.getMessage(),
                        "statusCode", e.getStatusCode()
                )
        );
    }

    @ExceptionHandler(UmapiException.class)
    public ResponseEntity<Map<String, Object>> onUmapi(UmapiException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of(
                        "error", "umapi_error",
                        "message", "Ошибка интеграции с UMAPI: " + e.getMessage()
                )
        );
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> onRuntime(RuntimeException e) {
        // наши parser/soap ошибки считаем как bad upstream
        HttpStatus status = HttpStatus.BAD_GATEWAY;
        return ResponseEntity.status(status).body(
                Map.of("error","laximo_error","message", e.getMessage())
        );
    }
}



package autoparts.kz.common.web;

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

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> onRuntime(RuntimeException e) {
        // наши parser/soap ошибки считаем как bad upstream
        HttpStatus status = HttpStatus.BAD_GATEWAY;
        return ResponseEntity.status(status).body(
                Map.of("error","laximo_error","message", e.getMessage())
        );
    }
}

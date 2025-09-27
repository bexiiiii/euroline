package autoparts.kz.modules.customers.service;

import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.customers.dto.CustomerSearchHistoryResponse;
import autoparts.kz.modules.customers.entity.CustomerSearchQuery;
import autoparts.kz.modules.customers.repository.CustomerRepository;
import autoparts.kz.modules.customers.repository.CustomerSearchHistoryRepository;
import autoparts.kz.modules.notifications.entity.Notification;
import autoparts.kz.modules.notifications.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository repo;
    private final CustomerSearchHistoryRepository history;
    private final PasswordEncoder encoder;
    private final NotificationService notifications;

    /**
     * Список клиентов с фильтрами:
     * q — поиск по email, имени, фамилии, телефону, названию клиента
     * status — "active"/"banned"/"true"/"false" (регистронезависимо)
     */
    public Page<User> list(String q, String status, Pageable p) {
        Specification<User> spec = (root, cq, cb) -> cb.conjunction();

        if (q != null && !q.isBlank()) {
            String like = "%" + q.toLowerCase() + "%";
            spec = spec.and((r, c, cb2) -> cb2.or(
                    cb2.like(cb2.lower(r.get("email")), like),
                    cb2.like(cb2.lower(r.get("name")), like),
                    cb2.like(cb2.lower(r.get("surname")), like),
                    cb2.like(cb2.lower(r.get("phone")), like),
                    cb2.like(cb2.lower(r.get("clientName")), like)
            ));
        }

        if (status != null && !status.isBlank()) {
            Boolean banned = parseStatusToBanned(status);
            if (banned != null) {
                spec = spec.and((r, c, cb2) -> cb2.equal(r.get("banned"), banned));
            }
        }

        return repo.findAll(spec, p);
    }

    public User get(Long id) {
        return repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Customer not found"));
    }

    public User create(User u) {
        if (u.getId() != null) u.setId(null);
        if (u.getPassword() != null && !u.getPassword().isBlank()) {
            u.setPassword(encoder.encode(u.getPassword()));
        }
        // по умолчанию не забанен
        // если нужно — явно: if (u.getBanned() == null) u.setBanned(false); // но у тебя primitive boolean
        return repo.save(u);
    }

    public User update(Long id, User u) {
        var db = get(id);

        if (u.getEmail() != null && !u.getEmail().isBlank()) db.setEmail(u.getEmail());
        if (u.getName() != null && !u.getName().isBlank()) db.setName(u.getName());
        if (u.getSurname() != null && !u.getSurname().isBlank()) db.setSurname(u.getSurname());
        if (u.getPhone() != null && !u.getPhone().isBlank()) db.setPhone(u.getPhone());
        if (u.getClientName() != null && !u.getClientName().isBlank()) db.setClientName(u.getClientName());
        if (u.getCountry() != null && !u.getCountry().isBlank()) db.setCountry(u.getCountry());
        if (u.getState() != null && !u.getState().isBlank()) db.setState(u.getState());
        if (u.getCity() != null && !u.getCity().isBlank()) db.setCity(u.getCity());
        if (u.getOfficeAddress() != null && !u.getOfficeAddress().isBlank()) db.setOfficeAddress(u.getOfficeAddress());
        if (u.getType() != null && !u.getType().isBlank()) db.setType(u.getType());
        if (u.getFathername() != null && !u.getFathername().isBlank()) db.setFathername(u.getFathername());

        if (u.getRole() != null) db.setRole(u.getRole());
        if (u.getPassword() != null && !u.getPassword().isBlank()) {
            db.setPassword(encoder.encode(u.getPassword()));
        }
        // БАН не обновляем здесь, для этого есть отдельный patchStatus

        return repo.save(db);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    /**
     * Патч статуса: ожидает строки "active"/"banned"/"true"/"false".
     * Записывает в поле boolean banned.
     */
    public Map<String, Object> patchStatus(Long id, String status) {
        var db = get(id);
        Boolean banned = parseStatusToBanned(status);
        if (banned == null) {
            throw new IllegalArgumentException("Unknown status value: " + status + " (expected active|banned|true|false)");
        }
        db.setBanned(banned);
        repo.save(db);
        return Map.of("id", id, "banned", banned, "status", banned ? "banned" : "active");
    }

    public void saveSearch(Long customerId, String q) {
        var rec = new CustomerSearchQuery();
        rec.setCustomerId(customerId);
        rec.setQuery(q);
        history.save(rec);
    }

    public Page<CustomerSearchHistoryResponse> searchHistory(Long customerId, Pageable p) {
        Page<CustomerSearchQuery> page = (customerId == null)
                ? history.findAll(p)
                : history.findAll((Specification<CustomerSearchQuery>) (r, c, cb) -> cb.equal(r.get("customerId"), customerId), p);

        if (page.isEmpty()) {
            return Page.empty(p);
        }

        List<CustomerSearchQuery> content = page.getContent();
        Set<Long> customerIds = content.stream()
                .map(CustomerSearchQuery::getCustomerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> names = customerIds.isEmpty()
                ? Map.of()
                : repo.findAllById(customerIds).stream()
                .collect(Collectors.toMap(User::getId, this::resolveClientName, (a, b) -> a, HashMap::new));

        return page.map(item -> new CustomerSearchHistoryResponse(
                item.getId(),
                item.getCustomerId(),
                names.get(item.getCustomerId()),
                item.getQuery(),
                item.getCreatedAt()
        ));
    }

    public Map<String, Object> searchAnalytics() {
        long total = history.count();
        return Map.of("totalQueries", total);
    }

    public Map<String, Object> stats() {
        return Map.of("totalCustomers", repo.count());
    }

    public int broadcastNewsletter(String subject, String message) {
        String title = sanitizeOrDefault(subject, "Новости Autoparts");
        String body = sanitizeOrDefault(message, "");

        var customers = repo.findAll().stream()
                .filter(user -> user != null && user.getId() != null)
                .filter(user -> !user.isBanned())
                .toList();

        customers.forEach(user ->
                notifications.createAndBroadcast(
                        user.getId(),
                        title,
                        body,
                        Notification.Type.SYSTEM,
                        Notification.Severity.INFO
                ));

        return customers.size();
    }

    private String sanitizeOrDefault(String value, String defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty() || "null".equalsIgnoreCase(trimmed)) {
            return defaultValue;
        }
        return trimmed;
    }

    // ---------- helpers ----------

    /**
     * Преобразует строку статуса в значение banned.
     * "active" -> false, "banned" -> true, "true" -> true, "false" -> false
     * Возвращает null, если не распознано.
     */
    private static Boolean parseStatusToBanned(String status) {
        String s = status.trim().toLowerCase();
        return switch (s) {
            case "active", "false" -> Boolean.FALSE;
            case "banned", "true" -> Boolean.TRUE;
            default -> null;
        };
    }

    private String resolveClientName(User user) {
        if (user == null) {
            return null;
        }

        if (user.getClientName() != null && !user.getClientName().isBlank()) {
            return user.getClientName();
        }

        StringBuilder builder = new StringBuilder();
        if (user.getSurname() != null && !user.getSurname().isBlank()) {
            builder.append(user.getSurname().trim());
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(user.getName().trim());
        }
        if (user.getFathername() != null && !user.getFathername().isBlank()) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(user.getFathername().trim());
        }

        if (builder.length() > 0) {
            return builder.toString();
        }

        return user.getEmail();
    }
}

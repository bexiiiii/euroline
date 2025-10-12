package autoparts.kz.modules.admin.importexport;

import autoparts.kz.modules.admin.Events.entity.EventLog;
import autoparts.kz.modules.admin.Events.repository.EventLogRepository;
import autoparts.kz.modules.admin.UserActivity.entity.UserActivity;
import autoparts.kz.modules.admin.UserActivity.repository.UserActivityRepository;
import autoparts.kz.modules.admin.categories.dto.AdminCategoryDto;
import autoparts.kz.modules.admin.categories.service.AdminCategoryService;
import autoparts.kz.modules.admin.dto.cart.AdminCartResponse;
import autoparts.kz.modules.admin.mapper.AdminCartMapper;
import autoparts.kz.modules.cart.entity.Cart;
import autoparts.kz.modules.cart.repository.CartRepository;
import autoparts.kz.modules.finance.entity.ClientBalance;
import autoparts.kz.modules.finance.repository.ClientBalanceRepository;
import autoparts.kz.modules.manualProducts.entity.Product;
import autoparts.kz.modules.manualProducts.repository.ProductRepository;
import autoparts.kz.modules.auth.repository.UserRepository;
import autoparts.kz.modules.auth.entity.User;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ImportExportService {

    private static final ZoneId ALMATY = ZoneId.of("Asia/Almaty");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ALMATY);

    private final ProductRepository productRepository;
    private final AdminCategoryService adminCategoryService;
    private final CartRepository cartRepository;
    private final EventLogRepository eventLogRepository;
    private final UserActivityRepository userActivityRepository;
    private final ClientBalanceRepository clientBalanceRepository;
    private final UserRepository userRepository;

    public ImportExportService(ProductRepository productRepository,
                               AdminCategoryService adminCategoryService,
                               CartRepository cartRepository,
                               EventLogRepository eventLogRepository,
                               UserActivityRepository userActivityRepository,
                               ClientBalanceRepository clientBalanceRepository,
                               UserRepository userRepository) {
        this.productRepository = productRepository;
        this.adminCategoryService = adminCategoryService;
        this.cartRepository = cartRepository;
        this.eventLogRepository = eventLogRepository;
        this.userActivityRepository = userActivityRepository;
        this.clientBalanceRepository = clientBalanceRepository;
        this.userRepository = userRepository;
    }

    public void importData(MultipartFile file) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withHeader())) {
            List<CSVRecord> records = csvParser.getRecords();
            for (CSVRecord record : records) {
                // Placeholder for future import logic
                record.toMap();
            }
        }
    }

    public record ExportResult(byte[] content, String fileName) {}

    public ExportResult exportData(String type, String from, String to) throws IOException {
        ExportWindow window = ExportWindow.create(from, to);
        return switch (type.toLowerCase(Locale.ROOT)) {
            case "products" -> exportProducts(window);
            case "categories" -> exportCategories(window);
            case "carts" -> exportCarts(window);
            case "event_logs", "event-logs", "eventlogs" -> exportEventLogs(window);
            case "user_activity", "user-activity", "useractivity" -> exportUserActivity(window);
            case "balances", "client_balances", "client-balances" -> exportClientBalances(window);
            default -> throw new IllegalArgumentException("Unknown export type: " + type);
        };
    }

    private ExportResult exportProducts(ExportWindow window) throws IOException {
        List<Product> products = productRepository.findAll();

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
            writer.write('\ufeff');
            try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(
                    "ID", "Название", "Код", "Бренд", "Внешний код", "Цена", "Склад", "Товар недели",
                    "Период недели с", "Период недели по", "Категория"
            ))) {
                for (Product product : products) {
                    if (!window.isWithin(product.getWeeklyStartAt())) {
                        // если задан диапазон и weeklyStartAt не попадает, продолжаем
                        if (window.hasRange() && product.getWeeklyStartAt() != null) {
                            continue;
                        }
                    }

                    printer.printRecord(
                            product.getId(),
                            product.getName(),
                            product.getCode(),
                            product.getBrand(),
                            product.getExternalCode(),
                            product.getPrice(),
                            product.getStock(),
                            Boolean.TRUE.equals(product.getIsWeekly()) ? "Да" : "Нет",
                            formatInstant(product.getWeeklyStartAt()),
                            formatInstant(product.getWeeklyEndAt()),
                            product.getCategory() != null ? product.getCategory().getName() : ""
                    );
                }
            }
        }

        return new ExportResult(outputStream.toByteArray(), buildFileName("products"));
    }

    private ExportResult exportCategories(ExportWindow window) throws IOException {
        List<AdminCategoryDto> tree = adminCategoryService.tree();
        List<FlattenedCategory> flat = flattenCategories(tree);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
            writer.write('\ufeff');
            try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(
                    "ID", "Название", "Уровень", "Родитель ID", "Slug", "Активна", "Сортировка",
                    "Количество товаров", "Создана", "Обновлена"
            ))) {
                for (FlattenedCategory category : flat) {
                    if (window.hasRange() && !window.isWithin(category.createdAt())) {
                        continue;
                    }
                    printer.printRecord(
                            category.id(),
                            category.name(),
                            category.level(),
                            category.parentId(),
                            category.slug(),
                            category.isActive() ? "Да" : "Нет",
                            category.sortOrder(),
                            category.productCount(),
                            formatInstant(category.createdAt()),
                            formatInstant(category.updatedAt())
                    );
                }
            }
        }

        return new ExportResult(outputStream.toByteArray(), buildFileName("categories"));
    }

    private ExportResult exportCarts(ExportWindow window) throws IOException {
        List<Cart> carts = cartRepository.findAllWithItems();

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
            writer.write('\ufeff');
            try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(
                    "ID корзины", "Покупатель", "Email", "Телефон", "Всего товаров",
                    "Сумма", "Статус", "Обновлена", "Товары"
            ))) {
                for (Cart cart : carts) {
                    AdminCartResponse response = AdminCartMapper.toResponse(cart);
                    if (window.hasRange() && !window.isWithin(response.getLastUpdated())) {
                        continue;
                    }
                    String items = response.getItems().stream()
                            .map(item -> item.getProductName() + " x" + item.getQuantity())
                            .collect(Collectors.joining("; "));

                    printer.printRecord(
                            response.getId(),
                            response.getCustomerName(),
                            response.getCustomerEmail(),
                            response.getCustomerPhone(),
                            response.getTotalItems(),
                            response.getTotalAmount(),
                            response.isAbandoned() ? "Брошенная" : "Активная",
                            formatInstant(response.getLastUpdated()),
                            items
                    );
                }
            }
        }

        return new ExportResult(outputStream.toByteArray(), buildFileName("carts"));
    }

    private ExportResult exportEventLogs(ExportWindow window) throws IOException {
        Specification<EventLog> spec = Specification.allOf();

        if (window.from() != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), window.from()));
        }
        if (window.to() != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), window.to()));
        }

        List<EventLog> events = eventLogRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
            writer.write('\ufeff');
            try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(
                    "ID", "Тип события", "Сущность", "Пользователь", "Описание",
                    "Успешно", "Ошибка", "IP", "User Agent", "Создано"
            ))) {
                for (EventLog event : events) {
                    printer.printRecord(
                            event.getId(),
                            event.getEventType(),
                            event.getEntityType(),
                            event.getUserName(),
                            event.getDescription(),
                            Boolean.TRUE.equals(event.getSuccess()) ? "Да" : "Нет",
                            Optional.ofNullable(event.getErrorMessage()).orElse(""),
                            event.getIpAddress(),
                            event.getUserAgent(),
                            formatInstant(event.getCreatedAt())
                    );
                }
            }
        }

        return new ExportResult(outputStream.toByteArray(), buildFileName("event-logs"));
    }

    private ExportResult exportUserActivity(ExportWindow window) throws IOException {
        Specification<UserActivity> spec = Specification.allOf();

        if (window.from() != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), window.from()));
        }
        if (window.to() != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), window.to()));
        }

        List<UserActivity> activities = userActivityRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
            writer.write('\ufeff');
            try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(
                    "ID", "ID пользователя", "Пользователь", "Модуль", "Действие",
                    "Статус", "IP", "User Agent", "Описание", "Создано"
            ))) {
                for (UserActivity activity : activities) {
                    printer.printRecord(
                            activity.getId(),
                            activity.getUserId(),
                            activity.getUserName(),
                            activity.getModule(),
                            activity.getAction(),
                            activity.getStatus(),
                            activity.getIpAddress(),
                            activity.getUserAgent(),
                            Optional.ofNullable(activity.getDetails()).orElse(""),
                            formatInstant(activity.getCreatedAt())
                    );
                }
            }
        }

        return new ExportResult(outputStream.toByteArray(), buildFileName("user-activity"));
    }

    private ExportResult exportClientBalances(ExportWindow window) throws IOException {
        List<ClientBalance> balances = clientBalanceRepository.findAll();
        Map<Long, User> users = userRepository.findAllById(
                balances.stream().map(ClientBalance::getClientId).toList()
        ).stream().collect(Collectors.toMap(User::getId, user -> user));

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
            writer.write('\ufeff');
            try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(
                    "ID клиента", "Имя клиента", "Email", "Баланс", "Обновлен"
            ))) {
                for (ClientBalance balance : balances) {
                    if (window.hasRange() && !window.isWithin(balance.getUpdatedAt())) {
                        continue;
                    }
                    User user = users.get(balance.getClientId());
                    printer.printRecord(
                            balance.getClientId(),
                            user != null ? resolveUserName(user) : "",
                            user != null ? user.getEmail() : "",
                            balance.getBalance(),
                            formatInstant(balance.getUpdatedAt())
                    );
                }
            }
        }

        return new ExportResult(outputStream.toByteArray(), buildFileName("client-balances"));
    }

    private static String resolveUserName(User user) {
        if (user == null) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        if (user.getSurname() != null && !user.getSurname().isBlank()) {
            builder.append(user.getSurname());
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(user.getName());
        }
        if (builder.length() == 0) {
            builder.append(Optional.ofNullable(user.getClientName()).orElse(user.getEmail()));
        }
        return builder.toString();
    }

    private String formatInstant(Instant instant) {
        if (instant == null) {
            return "";
        }
        return DATE_TIME_FORMATTER.format(instant);
    }

    private String buildFileName(String prefix) {
        String date = LocalDate.now(ALMATY).format(DateTimeFormatter.ISO_DATE);
        return prefix + "-" + date + ".csv";
    }

    private List<FlattenedCategory> flattenCategories(List<AdminCategoryDto> roots) {
        Deque<CategoryWithLevel> stack = new ArrayDeque<>();
        for (int i = roots.size() - 1; i >= 0; i--) {
            stack.push(new CategoryWithLevel(roots.get(i), 0));
        }

        List<FlattenedCategory> result = new java.util.ArrayList<>();
        while (!stack.isEmpty()) {
            CategoryWithLevel current = stack.pop();
            AdminCategoryDto dto = current.dto();
            result.add(new FlattenedCategory(
                    dto.getId(),
                    dto.getParentId(),
                    dto.getName(),
                    dto.getSlug(),
                    Boolean.TRUE.equals(dto.getIsActive()),
                    dto.getSortOrder(),
                    dto.getProductCount() != null ? dto.getProductCount() : 0L,
                    current.level(),
                    dto.getCreatedAt(),
                    dto.getUpdatedAt()
            ));
            if (dto.getSubcategories() != null && !dto.getSubcategories().isEmpty()) {
                for (int i = dto.getSubcategories().size() - 1; i >= 0; i--) {
                    stack.push(new CategoryWithLevel(dto.getSubcategories().get(i), current.level() + 1));
                }
            }
        }
        return result;
    }

    private record FlattenedCategory(Long id,
                                     Long parentId,
                                     String name,
                                     String slug,
                                     boolean isActive,
                                     Integer sortOrder,
                                     Long productCount,
                                     int level,
                                     Instant createdAt,
                                     Instant updatedAt) {}

    private record CategoryWithLevel(AdminCategoryDto dto, int level) {}

    private record ExportWindow(Instant from, Instant to) {
        static ExportWindow create(String from, String to) {
            Instant fromInstant = parseDate(from, true);
            Instant toInstant = parseDate(to, false);
            if (fromInstant != null && toInstant == null) {
                toInstant = fromInstant.plusSeconds(86399);
            }
            return new ExportWindow(fromInstant, toInstant);
        }

        boolean hasRange() {
            return from != null || to != null;
        }

        boolean isWithin(Instant instant) {
            if (!hasRange() || instant == null) {
                return true;
            }
            if (from != null && instant.isBefore(from)) {
                return false;
            }
            if (to != null && instant.isAfter(to)) {
                return false;
            }
            return true;
        }

        private static Instant parseDate(String value, boolean startOfDay) {
            if (value == null || value.isBlank()) {
                return null;
            }
            LocalDate date = LocalDate.parse(value);
            if (startOfDay) {
                return date.atStartOfDay(ALMATY).toInstant();
            }
            return date.plusDays(1).atStartOfDay(ALMATY).minusSeconds(1).toInstant();
        }
    }
}

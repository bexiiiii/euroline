package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.builder.OrdersCmlBuilder;
import autoparts.kz.modules.cml.domain.entity.CmlOrder;
import autoparts.kz.modules.cml.domain.entity.CmlOrderStatus;
import autoparts.kz.modules.cml.repo.CmlOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.xml.stream.XMLStreamException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;

/**
 * Профессиональный сервис экспорта заказов в 1С через CommerceML XML.
 * 
 * Экспортирует только NEW заказы, генерирует XML и сохраняет в MinIO.
 * После успешного экспорта помечает заказы как CONFIRMED.
 * Заказы в статусе CONFIRMED не экспортируются повторно - это предотвращает дубликаты.
 */
@Service
public class OrdersExportService {

    private static final Logger log = LoggerFactory.getLogger(OrdersExportService.class);

    private final CmlOrderRepository orderRepository;
    private final OrdersCmlBuilder builder;
    private final S3Storage storage;

    public OrdersExportService(CmlOrderRepository orderRepository,
                               OrdersCmlBuilder builder,
                               S3Storage storage) {
        this.orderRepository = orderRepository;
        this.builder = builder;
        this.storage = storage;
    }

    /**
     * Экспортирует новые заказы в формате CommerceML XML.
     * 
     * @param requestId идентификатор запроса для логирования
     * @return путь к созданному XML файлу в MinIO
     */
    @Transactional
    public String exportOrders(String requestId) {
        try {
            // ✅ Экспортируем только NEW заказы
            // После экспорта они станут CONFIRMED, и больше не будут экспортироваться
            List<CmlOrder> newOrders = orderRepository.findByStatusIn(
                Arrays.asList(CmlOrderStatus.NEW)
            );
            
            if (newOrders.isEmpty()) {
                log.info("📭 No NEW orders to export (requestId: {})", requestId);
                return null; // Нет заказов для экспорта
            }
            
            log.info("📦 Found {} NEW orders to export (requestId: {})", newOrders.size(), requestId);
            
            log.info("Found {} new orders to export (requestId: {})", newOrders.size(), requestId);
            
            // Генерируем XML
            byte[] xml = builder.build(newOrders);
            log.debug("XML built successfully, size: {} bytes", xml.length);
            
            // Сохраняем в MinIO с правильной структурой папок
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Almaty"));
            String key = "commerce-ml/outbox/orders/%d/%02d/%02d/orders_%s.xml".formatted(
                    today.getYear(),
                    today.getMonthValue(),
                    today.getDayOfMonth(),
                    requestId);
            
            storage.putObject(key, xml, "application/xml");
            log.info("✅ Exported {} orders to MinIO: {}", newOrders.size(), key);
            
            // ✅ Обновляем статус заказов - теперь они отправлены в 1С
            markOrdersAsExported(newOrders);
            
            return key;
            
        } catch (XMLStreamException e) {
            log.error("❌ XML generation failed for requestId {}: {}", requestId, e.getMessage(), e);
            throw new IllegalStateException("Unable to build orders XML", e);
        } catch (Exception e) {
            log.error("❌ Orders export failed for requestId {}: {}", requestId, e.getMessage(), e);
            throw new RuntimeException("Unable to export orders", e);
        }
    }
    
    /**
     * Помечает заказы как экспортированные (статус CONFIRMED).
     * Это предотвращает повторную отправку одних и тех же заказов.
     */
    private void markOrdersAsExported(List<CmlOrder> orders) {
        for (CmlOrder order : orders) {
            order.setStatus(CmlOrderStatus.CONFIRMED);
        }
        orderRepository.saveAll(orders);
        log.info("Marked {} orders as CONFIRMED (exported to 1C)", orders.size());
    }
}

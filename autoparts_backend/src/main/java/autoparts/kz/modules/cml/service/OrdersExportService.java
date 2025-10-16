package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.cml.builder.OrdersCmlBuilder;
import autoparts.kz.modules.cml.domain.entity.CmlOrder;
import autoparts.kz.modules.cml.repo.CmlOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.xml.stream.XMLStreamException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

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

    @Transactional(readOnly = true)
    public String exportOrders(String requestId) {
        try {
            List<CmlOrder> orders = orderRepository.findAll();
            log.info("Building XML for {} orders", orders.size());
            byte[] xml = builder.build(orders);
            log.info("XML built, size: {} bytes", xml.length);
            
            LocalDate today = LocalDate.now();
            String key = "commerce-ml/outbox/orders/%d/%02d/%02d/orders_%s.xml".formatted(
                    today.getYear(),
                    today.getMonthValue(),
                    today.getDayOfMonth(),
                    UUID.randomUUID());
            
            log.info("Saving to MinIO: {}", key);
            storage.putObject(key, xml, "application/xml");
            log.info("✅ Exported {} orders to {}", orders.size(), key);
            return key;
        } catch (XMLStreamException e) {
            log.error("XML building failed", e);
            e.printStackTrace();
            throw new IllegalStateException("Unable to build orders XML", e);
        } catch (Exception e) {
            log.error("Orders export failed", e);
            e.printStackTrace();
            throw new RuntimeException("Unable to export orders", e);
        }
    }
}

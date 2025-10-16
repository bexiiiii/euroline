package autoparts.kz.modules.cml.service;

import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import autoparts.kz.modules.cml.xml.ReturnDocumentXmlGenerator;
import autoparts.kz.modules.finance.entity.RefundRequest;
import autoparts.kz.modules.finance.repository.RefundRequestRepository;
import autoparts.kz.modules.order.entity.Order;
import autoparts.kz.modules.order.entity.OrderItem;
import autoparts.kz.modules.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Сервис для интеграции возвратов товаров с 1C через CommerceML
 * 
 * Workflow:
 * 1. Клиент создает заявку на возврат через сайт
 * 2. Админ видит заявку в админке и одобряет/отклоняет
 * 3. При одобрении заявка автоматически отправляется в 1C
 * 4. 1C обрабатывает возврат и может вернуть статус
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnIntegrationService {

    private final RefundRequestRepository refundRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ReturnDocumentXmlGenerator xmlGenerator;
    private final S3Storage s3Storage;

    /**
     * Отправляет одобренную заявку на возврат в 1C
     * Вызывается автоматически при изменении статуса на APPROVED
     */
    @Transactional
    public void sendReturnTo1C(Long refundRequestId) {
        RefundRequest refund = refundRepository.findById(refundRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Заявка на возврат не найдена: " + refundRequestId));
        
        // Проверяем, что заявка в статусе APPROVED и еще не отправлена
        if (refund.getStatus() != RefundRequest.Status.APPROVED) {
            log.warn("Попытка отправить возврат в 1C со статусом {}, пропускаем", refund.getStatus());
            return;
        }
        
        if (Boolean.TRUE.equals(refund.getSentTo1C())) {
            log.info("Возврат {} уже отправлен в 1C, пропускаем повторную отправку", refundRequestId);
            return;
        }
        
        try {
            // Получаем данные заказа
            Order order = orderRepository.findById(refund.getOrderId())
                    .orElseThrow(() -> new IllegalArgumentException("Заказ не найден: " + refund.getOrderId()));
            
            // Получаем товары заказа
            List<OrderItem> orderItems = order.getItems();
            if (orderItems == null || orderItems.isEmpty()) {
                log.warn("У заказа {} нет товаров, отправка возврата невозможна", order.getId());
                return;
            }
            
            // Получаем данные клиента
            User client = userRepository.findById(refund.getClientId())
                    .orElseThrow(() -> new IllegalArgumentException("Клиент не найден: " + refund.getClientId()));
            
            // Генерируем XML документ возврата
            String xml = xmlGenerator.generateReturnDocument(refund, order, orderItems, client);
            
            // Сохраняем XML в S3 для последующей обработки 1C
            String filename = "commerce-ml/outbox/returns/return-" + refund.getId() + "-" + System.currentTimeMillis() + ".xml";
            s3Storage.putObject(filename, xml.getBytes(), "application/xml");
            
            // Помечаем как отправленный
            refund.setSentTo1C(true);
            refund.setSentTo1CAt(Instant.now());
            refundRepository.save(refund);
            
            log.info("✅ Возврат {} успешно отправлен в 1C, файл: {}", refundRequestId, filename);
            
        } catch (Exception e) {
            log.error("❌ Ошибка отправки возврата {} в 1C: {}", refundRequestId, e.getMessage(), e);
            e.printStackTrace();
            throw new RuntimeException("Не удалось отправить возврат в 1C", e);
        }
    }
    
    /**
     * Отправляет все одобренные, но не отправленные возвраты в 1C
     * Может использоваться для batch обработки или повторной отправки
     */
    @Transactional
    public int sendPendingReturnsTo1C() {
        List<RefundRequest> pendingReturns = refundRepository.findAll().stream()
                .filter(r -> r.getStatus() == RefundRequest.Status.APPROVED)
                .filter(r -> !Boolean.TRUE.equals(r.getSentTo1C()))
                .toList();
        
        log.info("Найдено {} возвратов для отправки в 1C", pendingReturns.size());
        
        int successCount = 0;
        for (RefundRequest refund : pendingReturns) {
            try {
                sendReturnTo1C(refund.getId());
                successCount++;
            } catch (Exception e) {
                log.error("Не удалось отправить возврат {}: {}", refund.getId(), e.getMessage());
                e.printStackTrace();
            }
        }
        
        log.info("Отправлено {} из {} возвратов в 1C", successCount, pendingReturns.size());
        return successCount;
    }
    
    /**
     * Генерирует XML пакет возвратов для массовой выгрузки
     * Используется для endpoint /api/1c-exchange?type=return&mode=query
     */
    @Transactional(readOnly = true)
    public String generateReturnsPackageXml() {
        List<RefundRequest> approvedReturns = refundRepository.findAll().stream()
                .filter(r -> r.getStatus() == RefundRequest.Status.APPROVED)
                .filter(r -> !Boolean.TRUE.equals(r.getSentTo1C()))
                .toList();
        
        if (approvedReturns.isEmpty()) {
            log.info("Нет возвратов для выгрузки в 1C");
            return generateEmptyPackage();
        }
        
        log.info("Формируем пакет возвратов для 1C: {} документов", approvedReturns.size());
        
        List<ReturnDocumentXmlGenerator.RefundRequestWithDetails> returnDetails = new ArrayList<>();
        
        for (RefundRequest refund : approvedReturns) {
            try {
                Order order = orderRepository.findById(refund.getOrderId()).orElse(null);
                if (order == null) {
                    log.warn("Заказ {} не найден для возврата {}", refund.getOrderId(), refund.getId());
                    continue;
                }
                
                List<OrderItem> orderItems = order.getItems();
                if (orderItems == null || orderItems.isEmpty()) {
                    log.warn("У заказа {} нет товаров", order.getId());
                    continue;
                }
                
                User client = userRepository.findById(refund.getClientId()).orElse(null);
                if (client == null) {
                    log.warn("Клиент {} не найден для возврата {}", refund.getClientId(), refund.getId());
                    continue;
                }
                
                returnDetails.add(new ReturnDocumentXmlGenerator.RefundRequestWithDetails(
                    refund, order, orderItems, client
                ));
                
            } catch (Exception e) {
                log.error("Ошибка подготовки возврата {}: {}", refund.getId(), e.getMessage());
                e.printStackTrace();
            }
        }
        
        if (returnDetails.isEmpty()) {
            return generateEmptyPackage();
        }
        
        return xmlGenerator.generateReturnsPackage(returnDetails);
    }
    
    /**
     * Подтверждает получение возвратов 1C системой
     * Вызывается при запросе /api/1c-exchange?type=return&mode=success
     */
    @Transactional
    public void confirmReturnsReceived(List<Long> refundIds) {
        for (Long refundId : refundIds) {
            try {
                RefundRequest refund = refundRepository.findById(refundId).orElse(null);
                if (refund != null && refund.getStatus() == RefundRequest.Status.APPROVED) {
                    refund.setSentTo1C(true);
                    refund.setSentTo1CAt(Instant.now());
                    refundRepository.save(refund);
                    log.info("✅ 1C подтвердила получение возврата {}", refundId);
                }
            } catch (Exception e) {
                log.error("Ошибка подтверждения возврата {}: {}", refundId, e.getMessage());
                e.printStackTrace();
            }
        }
    }
    
    /**
     * Обновляет статус возврата на основе данных из 1C
     */
    @Transactional
    public void updateReturnStatusFrom1C(String externalId, String status1C) {
        // Ищем возврат по external ID (если 1C вернула его)
        List<RefundRequest> refunds = refundRepository.findAll().stream()
                .filter(r -> externalId.equals(r.getExternalId()))
                .toList();
        
        if (refunds.isEmpty()) {
            log.warn("Возврат с externalId {} не найден", externalId);
            return;
        }
        
        RefundRequest refund = refunds.get(0);
        
        // Мапим статусы 1C на наши
        switch (status1C.toLowerCase()) {
            case "processed", "completed", "done" -> {
                refund.setStatus(RefundRequest.Status.DONE);
                log.info("✅ Возврат {} обработан в 1C", refund.getId());
            }
            case "rejected", "cancelled" -> {
                refund.setStatus(RefundRequest.Status.REJECTED);
                log.info("❌ Возврат {} отклонен в 1C", refund.getId());
            }
            default -> log.warn("Неизвестный статус из 1C: {}", status1C);
        }
        
        refund.setExternalId(externalId);
        refundRepository.save(refund);
    }
    
    private String generateEmptyPackage() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
               "<КоммерческаяИнформация ВерсияСхемы=\"2.05\" ДатаФормирования=\"" +
               java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
                   .format(Instant.now().atZone(java.time.ZoneId.systemDefault())) +
               "\">\n" +
               "  <!-- Нет возвратов для выгрузки -->\n" +
               "</КоммерческаяИнформация>\n";
    }
}

package autoparts.kz.modules.stockOneC.service;

/**
 * Интерфейс для интеграции с 1С
 * Определяет основные методы синхронизации данных
 */
public interface OneCIntegrationService {
    
    /**
     * Проверить соединение с 1С
     * @return true если соединение установлено
     */
    boolean testConnection();
    
    /**
     * Синхронизировать каталог товаров из 1С
     */
    void syncCatalog();
    
    /**
     * Отправить заказ в 1С
     * @param orderId ID заказа для отправки
     */
    void sendOrderToOneC(Long orderId);
    
    /**
     * Отправить все ожидающие заказы в 1С
     */
    void sendPendingOrdersToOneC();
    
    /**
     * Получить статус последней синхронизации
     * @return информация о последней синхронизации
     */
    SyncStatus getLastSyncStatus();
    
    /**
     * Статус синхронизации
     */
    class SyncStatus {
        private String type;
        private String status;
        private String lastSyncTime;
        private String message;
        
        public SyncStatus(String type, String status, String lastSyncTime, String message) {
            this.type = type;
            this.status = status;
            this.lastSyncTime = lastSyncTime;
            this.message = message;
        }
        
        // Getters and setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getLastSyncTime() { return lastSyncTime; }
        public void setLastSyncTime(String lastSyncTime) { this.lastSyncTime = lastSyncTime; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}

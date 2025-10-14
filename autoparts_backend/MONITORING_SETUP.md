# ⚙️ КОНФИГУРАЦИЯ МОНИТОРИНГА И АЛЕРТОВ

**Дата:** 2025-10-14  
**Статус:** 📋 READY TO DEPLOY

---

## 📊 1. SPRING BOOT ACTUATOR + PROMETHEUS

### Добавить в `pom.xml`:
```xml
<dependencies>
    <!-- Actuator for metrics -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    
    <!-- Micrometer Prometheus registry -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>
</dependencies>
```

### Добавить в `application-prod.yml`:
```yaml
# Actuator Configuration
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,env
      base-path: /actuator
  endpoint:
    health:
      show-details: always
      probes:
        enabled: true
    metrics:
      enabled: true
    prometheus:
      enabled: true
  
  # Metrics configuration
  metrics:
    export:
      prometheus:
        enabled: true
        step: 1m
    tags:
      application: ${spring.application.name}
      environment: production
    distribution:
      percentiles-histogram:
        http.server.requests: true
      slo:
        http.server.requests: 50ms,100ms,200ms,500ms,1s,2s
    
  # Health indicators
  health:
    db:
      enabled: true
    diskspace:
      enabled: true
    redis:
      enabled: true
    rabbitmq:
      enabled: true

# HikariCP metrics
spring:
  datasource:
    hikari:
      register-mbeans: true

# Custom metrics
app:
  metrics:
    enabled: true
    db-connection-pool-alerts: true
    response-time-alerts: true
    error-rate-alerts: true
```

---

## 📈 2. PROMETHEUS CONFIGURATION

### Создать файл `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'autoparts-production'
    region: 'kz-almaty'

# Alert manager
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

# Rule files
rule_files:
  - 'alerts.yml'

# Scrape configs
scrape_configs:
  # Spring Boot Application
  - job_name: 'autoparts-backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['localhost:8080']
        labels:
          app: 'autoparts'
          env: 'production'
    
  # PostgreSQL Exporter
  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']
  
  # RabbitMQ Exporter
  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq-exporter:9419']
  
  # Redis Exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
  
  # Node Exporter (System metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

---

## 🚨 3. ALERT RULES

### Создать файл `alerts.yml`:
```yaml
groups:
  # Application Performance Alerts
  - name: application_performance
    interval: 30s
    rules:
      # High Response Time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 0.5
        for: 2m
        labels:
          severity: warning
          component: application
        annotations:
          summary: "High response time detected"
          description: "P95 response time is {{ $value }}s (threshold: 500ms)"
      
      # Very High Response Time
      - alert: VeryHighResponseTime
        expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 1
        for: 1m
        labels:
          severity: critical
          component: application
        annotations:
          summary: "CRITICAL: Very high response time"
          description: "P95 response time is {{ $value }}s (threshold: 1s)"
      
      # High Error Rate
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) > 0.01
        for: 2m
        labels:
          severity: warning
          component: application
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 1%)"
      
      # Critical Error Rate
      - alert: CriticalErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
          component: application
        annotations:
          summary: "CRITICAL: Very high error rate"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

  # Database Alerts
  - name: database_alerts
    interval: 30s
    rules:
      # Connection Pool Exhaustion Warning
      - alert: ConnectionPoolHighUsage
        expr: hikaricp_connections_active / hikaricp_connections_max > 0.8
        for: 2m
        labels:
          severity: warning
          component: database
        annotations:
          summary: "Database connection pool usage high"
          description: "Connection pool usage is {{ $value | humanizePercentage }} (threshold: 80%)"
      
      # Connection Pool Exhaustion Critical
      - alert: ConnectionPoolCritical
        expr: hikaricp_connections_active / hikaricp_connections_max > 0.95
        for: 1m
        labels:
          severity: critical
          component: database
        annotations:
          summary: "CRITICAL: Connection pool nearly exhausted"
          description: "Connection pool usage is {{ $value | humanizePercentage }} (threshold: 95%)"
      
      # Long Connection Acquisition Time
      - alert: SlowConnectionAcquisition
        expr: hikaricp_connections_acquire_seconds{quantile="0.95"} > 0.5
        for: 2m
        labels:
          severity: warning
          component: database
        annotations:
          summary: "Slow database connection acquisition"
          description: "P95 connection acquisition time is {{ $value }}s (threshold: 500ms)"
      
      # Database Down
      - alert: DatabaseDown
        expr: up{job="postgresql"} == 0
        for: 1m
        labels:
          severity: critical
          component: database
        annotations:
          summary: "CRITICAL: Database is down"
          description: "PostgreSQL is not responding"

  # JVM Alerts
  - name: jvm_alerts
    interval: 30s
    rules:
      # High Heap Memory Usage
      - alert: HighHeapMemory
        expr: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.8
        for: 3m
        labels:
          severity: warning
          component: jvm
        annotations:
          summary: "High JVM heap memory usage"
          description: "Heap memory usage is {{ $value | humanizePercentage }} (threshold: 80%)"
      
      # Critical Heap Memory
      - alert: CriticalHeapMemory
        expr: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.95
        for: 1m
        labels:
          severity: critical
          component: jvm
        annotations:
          summary: "CRITICAL: JVM heap memory critical"
          description: "Heap memory usage is {{ $value | humanizePercentage }} (threshold: 95%)"
      
      # Long GC Pauses
      - alert: LongGCPause
        expr: rate(jvm_gc_pause_seconds_sum[1m]) > 0.5
        for: 2m
        labels:
          severity: warning
          component: jvm
        annotations:
          summary: "Long GC pauses detected"
          description: "Application is spending {{ $value | humanizePercentage }} time in GC"
      
      # Too Many Threads
      - alert: HighThreadCount
        expr: jvm_threads_live > 500
        for: 5m
        labels:
          severity: warning
          component: jvm
        annotations:
          summary: "High thread count"
          description: "Thread count is {{ $value }} (threshold: 500)"

  # RabbitMQ Alerts
  - name: rabbitmq_alerts
    interval: 30s
    rules:
      # Queue Building Up
      - alert: RabbitMQQueueBuildup
        expr: rabbitmq_queue_messages > 1000
        for: 5m
        labels:
          severity: warning
          component: rabbitmq
        annotations:
          summary: "RabbitMQ queue building up"
          description: "Queue {{ $labels.queue }} has {{ $value }} messages"
      
      # Consumer Down
      - alert: RabbitMQNoConsumers
        expr: rabbitmq_queue_consumers == 0
        for: 2m
        labels:
          severity: critical
          component: rabbitmq
        annotations:
          summary: "CRITICAL: No consumers for queue"
          description: "Queue {{ $labels.queue }} has no consumers"
      
      # RabbitMQ Down
      - alert: RabbitMQDown
        expr: up{job="rabbitmq"} == 0
        for: 1m
        labels:
          severity: critical
          component: rabbitmq
        annotations:
          summary: "CRITICAL: RabbitMQ is down"
          description: "RabbitMQ is not responding"

  # System Alerts
  - name: system_alerts
    interval: 30s
    rules:
      # High CPU Usage
      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}% (threshold: 80%)"
      
      # Critical CPU Usage
      - alert: CriticalCPUUsage
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 95
        for: 2m
        labels:
          severity: critical
          component: system
        annotations:
          summary: "CRITICAL: CPU usage critical"
          description: "CPU usage is {{ $value }}% (threshold: 95%)"
      
      # Low Disk Space
      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 20
        for: 5m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "Low disk space"
          description: "Disk {{ $labels.mountpoint }} has {{ $value }}% free space"
      
      # Critical Disk Space
      - alert: CriticalDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 2m
        labels:
          severity: critical
          component: system
        annotations:
          summary: "CRITICAL: Disk space critical"
          description: "Disk {{ $labels.mountpoint }} has {{ $value }}% free space"
```

---

## 📧 4. ALERTMANAGER CONFIGURATION

### Создать файл `alertmanager.yml`:
```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@euroline.kz'
  smtp_auth_username: 'alerts@euroline.kz'
  smtp_auth_password: 'your-password'
  smtp_require_tls: true

# Templates
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# Route tree
route:
  receiver: 'team-notifications'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  
  routes:
    # Critical alerts - immediate notification
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 10s
      repeat_interval: 5m
    
    # Database alerts
    - match:
        component: database
      receiver: 'database-team'
    
    # Application alerts
    - match:
        component: application
      receiver: 'dev-team'

# Receivers
receivers:
  # Default receiver
  - name: 'team-notifications'
    email_configs:
      - to: 'team@euroline.kz'
        headers:
          Subject: '[Autoparts] {{ .GroupLabels.alertname }}'
    
    # Telegram notifications (optional)
    telegram_configs:
      - bot_token: 'YOUR_BOT_TOKEN'
        chat_id: YOUR_CHAT_ID
        parse_mode: 'HTML'
  
  # Critical alerts - multiple channels
  - name: 'critical-alerts'
    email_configs:
      - to: 'admin@euroline.kz,team@euroline.kz'
        headers:
          Subject: '🚨 CRITICAL: [Autoparts] {{ .GroupLabels.alertname }}'
    telegram_configs:
      - bot_token: 'YOUR_BOT_TOKEN'
        chat_id: YOUR_CHAT_ID
        parse_mode: 'HTML'
  
  # Database team
  - name: 'database-team'
    email_configs:
      - to: 'dba@euroline.kz'
        headers:
          Subject: '[DB] {{ .GroupLabels.alertname }}'
  
  # Dev team
  - name: 'dev-team'
    email_configs:
      - to: 'dev@euroline.kz'
        headers:
          Subject: '[App] {{ .GroupLabels.alertname }}'

# Inhibit rules
inhibit_rules:
  # Inhibit warning if critical is firing
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

---

## 🐳 5. DOCKER COMPOSE SETUP

### Создать файл `docker-compose-monitoring.yml`:
```yaml
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts.yml:/etc/prometheus/alerts.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    ports:
      - "9090:9090"
    restart: unless-stopped
    networks:
      - monitoring

  # Alertmanager
  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    ports:
      - "9093:9093"
    restart: unless-stopped
    networks:
      - monitoring

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus

  # PostgreSQL Exporter
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://postgres:postgres@postgres:5432/eurolinecloud?sslmode=disable"
    ports:
      - "9187:9187"
    restart: unless-stopped
    networks:
      - monitoring

  # Redis Exporter
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    environment:
      REDIS_ADDR: "redis:6379"
    ports:
      - "9121:9121"
    restart: unless-stopped
    networks:
      - monitoring

  # RabbitMQ (с prometheus plugin встроенным)
  # Уже запущен, нужно только активировать плагин:
  # docker exec rabbitmq rabbitmq-plugins enable rabbitmq_prometheus

  # Node Exporter
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    ports:
      - "9100:9100"
    restart: unless-stopped
    networks:
      - monitoring

volumes:
  prometheus-data:
  alertmanager-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

---

## 📊 6. GRAFANA DASHBOARD JSON

### Основной Dashboard (сохранить как `grafana/dashboards/autoparts-main.json`):
```json
{
  "dashboard": {
    "title": "Autoparts Production Monitoring",
    "tags": ["autoparts", "production"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Request Rate (RPS)",
        "targets": [
          {
            "expr": "rate(http_server_requests_seconds_count[1m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_server_requests_seconds_count{status=~\"5..\"}[5m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "DB Connection Pool Usage",
        "targets": [
          {
            "expr": "hikaricp_connections_active / hikaricp_connections_max * 100"
          }
        ],
        "type": "gauge"
      },
      {
        "title": "JVM Heap Memory",
        "targets": [
          {
            "expr": "jvm_memory_used_bytes{area=\"heap\"} / jvm_memory_max_bytes{area=\"heap\"} * 100"
          }
        ],
        "type": "gauge"
      },
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

---

## 🚀 7. DEPLOYMENT STEPS

### Шаг 1: Добавить зависимости в проект
```bash
cd /Users/behruztohtamishov/euroline/autoparts_backend
# Уже добавлено в pom.xml выше
mvn clean package -DskipTests
```

### Шаг 2: Запустить мониторинг стек
```bash
cd /Users/behruztohtamishov/euroline/docker
docker-compose -f docker-compose-monitoring.yml up -d
```

### Шаг 3: Активировать RabbitMQ Prometheus plugin
```bash
docker exec rabbitmq rabbitmq-plugins enable rabbitmq_prometheus
```

### Шаг 4: Проверить endpoints
```bash
# Application metrics
curl http://localhost:8080/actuator/prometheus

# Health check
curl http://localhost:8080/actuator/health

# Prometheus UI
open http://localhost:9090

# Grafana UI
open http://localhost:3000
# Login: admin / admin123
```

### Шаг 5: Настроить Grafana
1. Открыть http://localhost:3000
2. Login: admin / admin123
3. Add Data Source → Prometheus → http://prometheus:9090
4. Import Dashboard → Load JSON → используйте autoparts-main.json

---

## 📈 8. КЛЮЧЕВЫЕ МЕТРИКИ ДЛЯ МОНИТОРИНГА

### Application Metrics:
- `http_server_requests_seconds_count` - RPS
- `http_server_requests_seconds_sum` - Total response time
- `http_server_requests_seconds_bucket` - Response time distribution

### Database Metrics:
- `hikaricp_connections_active` - Active connections
- `hikaricp_connections_max` - Max connections
- `hikaricp_connections_pending` - Pending connection requests
- `hikaricp_connections_acquire_seconds` - Connection acquisition time

### JVM Metrics:
- `jvm_memory_used_bytes` - Memory usage
- `jvm_memory_max_bytes` - Max memory
- `jvm_gc_pause_seconds_sum` - GC pause time
- `jvm_threads_live` - Active threads

### System Metrics:
- `node_cpu_seconds_total` - CPU usage
- `node_memory_MemAvailable_bytes` - Available memory
- `node_filesystem_avail_bytes` - Disk space

---

## ✅ VERIFICATION CHECKLIST

- [ ] Actuator endpoints доступны
- [ ] Prometheus scraping работает
- [ ] Grafana dashboard отображает метрики
- [ ] Alerts настроены и тестируются
- [ ] Email/Telegram уведомления работают
- [ ] Load testing выполнен
- [ ] Documentation обновлена

---

**Статус:** 📋 READY TO DEPLOY  
**Estimated Setup Time:** 2-3 часа  
**Impact:** Predictive maintenance, zero downtime

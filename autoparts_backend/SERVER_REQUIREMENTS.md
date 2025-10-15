# 🖥️ ТРЕБОВАНИЯ К СЕРВЕРУ ДЛЯ PRODUCTION

**Для 10,000-25,000 одновременных пользователей**

---

## 📊 РЕКОМЕНДУЕМАЯ КОНФИГУРАЦИЯ

### ⭐ **Вариант 1: Один сервер (< 15,000 users)**

```yaml
Спецификация:
  CPU: 4-8 vCPU
  RAM: 8-16 GB
  Storage: 100 GB SSD (NVMe предпочтительно)
  Network: 1 Gbps
  OS: Ubuntu 22.04 LTS

Распределение ресурсов:
  ├── Spring Boot Application: 6 GB RAM, 3 vCPU
  ├── PostgreSQL Database: 2 GB RAM, 1 vCPU
  ├── Redis Cache: 512 MB RAM, 0.5 vCPU
  └── RabbitMQ: 1 GB RAM, 0.5 vCPU
```

**Стоимость:**
- **Hetzner CX41:** €15/месяц (~$16) 🔥 Лучшее предложение!
- **DigitalOcean Droplet:** $48/месяц
- **AWS EC2 t3.xlarge:** $120/месяц

---

### ⭐⭐ **Вариант 2: Два сервера (15,000-25,000 users)** ✅ РЕКОМЕНДУЕТСЯ

#### App Server:
```yaml
Спецификация:
  CPU: 4 vCPU
  RAM: 8 GB
  Storage: 50 GB SSD
  
Сервисы:
  ├── Spring Boot Application: 6 GB RAM
  ├── Redis Cache: 1 GB RAM
  └── RabbitMQ: 1 GB RAM
```

#### Database Server:
```yaml
Спецификация:
  CPU: 2-4 vCPU
  RAM: 4-8 GB
  Storage: 100 GB SSD (IOPS важен!)
  
Сервисы:
  └── PostgreSQL: 4 GB RAM
```

**Стоимость:**
- **Hetzner (2 сервера):** €30/месяц (~$32) 🔥
- **DigitalOcean (2 сервера):** $80/месяц
- **AWS (2 EC2):** $200/месяц

---

## 🔧 ДЕТАЛЬНЫЕ НАСТРОЙКИ

### 1️⃣ **JVM Configuration**

Файл: `start-production.sh` (уже создан!)

```bash
-Xms4G -Xmx6G                    # Heap: 4-6 GB
-XX:+UseG1GC                      # G1 Garbage Collector
-XX:MaxGCPauseMillis=200          # GC пауза max 200ms
-XX:+HeapDumpOnOutOfMemoryError   # Дамп при OOM
```

**Почему эти значения:**
- 4-6 GB heap - оптимально для 8GB RAM сервера
- G1GC - лучший GC для больших heap и низкой латентности
- 200ms паузы - незаметно для пользователей

---

### 2️⃣ **PostgreSQL Configuration**

Файл: `/etc/postgresql/14/main/postgresql.conf`

```ini
# Connections
max_connections = 150
superuser_reserved_connections = 5

# Memory Settings
shared_buffers = 2GB              # 25% от RAM
effective_cache_size = 6GB        # 75% от RAM
maintenance_work_mem = 512MB      # Для VACUUM, INDEX
work_mem = 32MB                   # На query

# WAL Settings
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Query Planner
random_page_cost = 1.1            # Для SSD (default: 4.0)
effective_io_concurrency = 200    # Для SSD (default: 1)
default_statistics_target = 100   # Для лучших планов

# Logging (для мониторинга)
log_min_duration_statement = 1000 # Логировать медленные запросы > 1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

**Применить настройки:**
```bash
sudo systemctl restart postgresql
```

---

### 3️⃣ **Redis Configuration**

Файл: `/etc/redis/redis.conf`

```ini
# Memory
maxmemory 1gb
maxmemory-policy allkeys-lru      # Удалять старые ключи при нехватке памяти

# Persistence (ВЫКЛЮЧИТЬ для cache)
save ""                           # Не сохранять на диск
appendonly no                     # Не использовать AOF

# Network
bind 127.0.0.1                    # Только localhost (если на одном сервере)
protected-mode yes
port 6379
timeout 300

# Performance
tcp-backlog 511
tcp-keepalive 300
```

**Применить настройки:**
```bash
sudo systemctl restart redis
```

---

### 4️⃣ **Nginx Reverse Proxy** (опционально, но рекомендуется)

Файл: `/etc/nginx/sites-available/autoparts`

```nginx
upstream autoparts_backend {
    server 127.0.0.1:8080;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;

    # SSL (настроить с Let's Encrypt)
    # listen 443 ssl http2;
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        proxy_pass http://autoparts_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (если есть)
    location /uploads/ {
        alias /var/www/autoparts/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Активировать:**
```bash
sudo ln -s /etc/nginx/sites-available/autoparts /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Подготовка сервера:

```bash
# 1. Обновить систему
sudo apt update && sudo apt upgrade -y

# 2. Установить Java 17
sudo apt install openjdk-17-jdk -y
java -version

# 3. Установить PostgreSQL 14
sudo apt install postgresql-14 postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 4. Установить Redis
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 5. Установить RabbitMQ (если не в Docker)
sudo apt install rabbitmq-server -y
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server

# 6. Установить Nginx
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# 7. Настроить firewall
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### Развертывание приложения:

```bash
# 1. Загрузить проект на сервер
scp -r autoparts_backend root@your-server-ip:/opt/

# 2. Перейти в директорию
cd /opt/autoparts_backend

# 3. Создать директории
sudo mkdir -p /var/log/autoparts
sudo mkdir -p /var/run

# 4. Собрать проект
mvn clean package -DskipTests

# 5. Сделать скрипты исполняемыми
chmod +x start-production.sh
chmod +x stop-production.sh

# 6. Запустить приложение
./start-production.sh

# 7. Проверить статус
curl http://localhost:8080/actuator/health

# 8. Проверить метрики
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
```

---

## 📊 МОНИТОРИНГ

### Команды для проверки ресурсов:

```bash
# CPU и Memory
htop

# JVM Heap Usage
jstat -gc $(cat /var/run/autoparts.pid) 1000

# PostgreSQL Connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Redis Memory
redis-cli INFO memory

# Disk I/O
iostat -x 1

# Network
iftop

# Application Logs
tail -f /var/log/autoparts/application.log

# Errors
tail -f /var/log/autoparts/application.log | grep -i error
```

---

## 💰 СРАВНЕНИЕ ПРОВАЙДЕРОВ

| Провайдер | CPU | RAM | Storage | Bandwidth | Цена/мес | Рейтинг |
|-----------|-----|-----|---------|-----------|----------|---------|
| **Hetzner CX41** | 4 vCPU | 16GB | 160GB SSD | 20TB | €15 ($16) | ⭐⭐⭐⭐⭐ |
| **Contabo VPS L** | 8 vCPU | 30GB | 800GB SSD | Unlimited | €13 ($14) | ⭐⭐⭐⭐⭐ |
| **DigitalOcean** | 4 vCPU | 8GB | 160GB SSD | 5TB | $48 | ⭐⭐⭐⭐ |
| **Vultr** | 4 vCPU | 8GB | 180GB SSD | 4TB | $48 | ⭐⭐⭐⭐ |
| **AWS EC2 t3.xlarge** | 4 vCPU | 16GB | EBS | - | $120 | ⭐⭐⭐ |
| **Azure B4ms** | 4 vCPU | 16GB | 32GB | - | $140 | ⭐⭐⭐ |

**🏆 Победитель:** Hetzner или Contabo для лучшего соотношения цена/качество!

---

## 🎯 РЕКОМЕНДАЦИИ

### Для 10,000 пользователей:
- ✅ **1 сервер:** Hetzner CX31 (2 vCPU, 8GB RAM) - €10/мес
- ✅ JVM: -Xms3G -Xmx5G

### Для 15,000 пользователей:
- ✅ **1 сервер:** Hetzner CX41 (4 vCPU, 16GB RAM) - €15/мес
- ✅ JVM: -Xms4G -Xmx6G

### Для 20,000-25,000 пользователей:
- ✅ **2 сервера:** 
  - App: CX31 (8GB) - €10/мес
  - DB: CX31 (8GB) - €10/мес
- ✅ JVM: -Xms4G -Xmx6G
- ✅ **Итого:** €20/мес (~$22)

---

## 🚨 ВАЖНЫЕ ЗАМЕЧАНИЯ

### ✅ Обязательно:
1. **SSD Storage** - обязательно для PostgreSQL (IOPS критичен!)
2. **Приватная сеть** - если используете 2 сервера (безопасность + скорость)
3. **Backup** - настройте автоматические бэкапы PostgreSQL
4. **Мониторинг** - используйте Prometheus + Grafana (см. MONITORING_SETUP.md)
5. **SSL** - Let's Encrypt для HTTPS (бесплатно)

### ⚠️ Не экономьте на:
- ❌ SSD (не используйте HDD!)
- ❌ RAM (минимум 8GB для app сервера)
- ❌ Network bandwidth (минимум 1 Gbps)

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

- [PostgreSQL Tuning](https://pgtune.leopard.in.ua/)
- [JVM Performance Tuning](https://docs.oracle.com/en/java/javase/17/gctuning/)
- [Spring Boot Production Best Practices](https://docs.spring.io/spring-boot/docs/current/reference/html/deployment.html)

---

**Создано:** 2025-10-14  
**Обновлено:** После оптимизаций (121x improvement)

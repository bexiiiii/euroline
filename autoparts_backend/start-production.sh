#!/bin/bash

##############################################
# Production Startup Script
# Для 10,000-25,000 пользователей
##############################################

set -e

APP_NAME="autoparts"
APP_VERSION="0.0.1-SNAPSHOT"
JAR_FILE="target/${APP_NAME}-${APP_VERSION}.jar"
LOG_DIR="/var/log/${APP_NAME}"
PID_FILE="/var/run/${APP_NAME}.pid"

# Environment Variables for RabbitMQ, Redis, S3
export RABBIT_HOST="${RABBIT_HOST:-127.0.0.1}"
export RABBIT_PORT="${RABBIT_PORT:-5672}"
export RABBIT_USER="${RABBIT_USER:-cml}"
export RABBIT_PASSWORD="${RABBIT_PASSWORD:-cml}"

# JVM Settings для 8GB RAM сервера
export JAVA_OPTS="-Xms4G -Xmx6G \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=${LOG_DIR}/heap_dump.hprof \
  -XX:+UseStringDeduplication \
  -XX:+OptimizeStringConcat \
  -Djava.security.egd=file:/dev/./urandom"

# Spring Boot Settings
export SPRING_OPTS="--spring.profiles.active=prod \
  --server.port=8080 \
  --logging.file.name=${LOG_DIR}/application.log"

# Создать директорию для логов
mkdir -p ${LOG_DIR}

# Проверить наличие JAR файла
if [ ! -f "${JAR_FILE}" ]; then
    echo "❌ JAR file not found: ${JAR_FILE}"
    echo "Run: mvn clean package -DskipTests"
    exit 1
fi

# Проверить запущен ли уже процесс
if [ -f "${PID_FILE}" ]; then
    OLD_PID=$(cat ${PID_FILE})
    if ps -p ${OLD_PID} > /dev/null 2>&1; then
        echo "⚠️  Application already running with PID: ${OLD_PID}"
        echo "Stop it first: kill ${OLD_PID}"
        exit 1
    else
        echo "Removing stale PID file"
        rm ${PID_FILE}
    fi
fi

echo "🚀 Starting ${APP_NAME} in PRODUCTION mode..."
echo "📊 JVM Settings:"
echo "   - Heap: 4GB min, 6GB max"
echo "   - GC: G1GC with 200ms pause target"
echo "   - Logs: ${LOG_DIR}"
echo ""

# Запустить приложение в фоне
nohup java ${JAVA_OPTS} -jar ${JAR_FILE} ${SPRING_OPTS} \
  >> ${LOG_DIR}/console.log 2>&1 &

# Сохранить PID
echo $! > ${PID_FILE}

echo "✅ Application started with PID: $(cat ${PID_FILE})"
echo ""
echo "📝 Monitor logs:"
echo "   tail -f ${LOG_DIR}/application.log"
echo "   tail -f ${LOG_DIR}/console.log"
echo ""
echo "🔍 Check health:"
echo "   curl http://localhost:8080/actuator/health"
echo ""
echo "🛑 Stop application:"
echo "   kill $(cat ${PID_FILE})"
echo ""
echo "🎉 Deployment complete!"

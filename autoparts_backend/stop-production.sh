#!/bin/bash

##############################################
# Production Stop Script
##############################################

set -e

APP_NAME="autoparts"
PID_FILE="/var/run/${APP_NAME}.pid"

if [ ! -f "${PID_FILE}" ]; then
    echo "❌ PID file not found: ${PID_FILE}"
    echo "Application is not running"
    exit 1
fi

PID=$(cat ${PID_FILE})

if ! ps -p ${PID} > /dev/null 2>&1; then
    echo "⚠️  Process ${PID} is not running"
    rm ${PID_FILE}
    exit 1
fi

echo "🛑 Stopping application (PID: ${PID})..."

# Graceful shutdown
kill ${PID}

# Ждать до 30 секунд
for i in {1..30}; do
    if ! ps -p ${PID} > /dev/null 2>&1; then
        echo "✅ Application stopped gracefully"
        rm ${PID_FILE}
        exit 0
    fi
    echo "Waiting for shutdown... (${i}/30)"
    sleep 1
done

# Force kill если не остановилось
echo "⚠️  Forcing shutdown..."
kill -9 ${PID}
rm ${PID_FILE}
echo "✅ Application force stopped"

#!/bin/bash
# Script to clear Liquibase changelog table and restart migrations

echo "====================================================="
echo "  Clearing Liquibase history and restarting migrations"
echo "====================================================="
echo "This script will:"
echo " 1. Clear Liquibase tables to remove checksum conflicts"
echo " 2. Rerun all migrations from scratch"
echo "====================================================="
echo ""

# Connect to PostgreSQL and clear Liquibase tables
PGPASSWORD=234Bex456 psql -h localhost -U postgres -d autoparts -c "DROP TABLE IF EXISTS databasechangeloglock;"
PGPASSWORD=234Bex456 psql -h localhost -U postgres -d autoparts -c "DROP TABLE IF EXISTS databasechangelog;"

echo "Liquibase tables cleared."
echo "Running migrations again..."

cd /Users/behruztohtamishov/euroline/autoparts_backend
./mvnw liquibase:update

RESULT=$?
if [ $RESULT -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
else
  echo ""
  echo "❌ Migration failed with error code: $RESULT"
  echo "Please check the logs for more details."
fi
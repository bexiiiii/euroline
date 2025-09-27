#!/bin/bash
# Script to run Liquibase migration manually

echo "====================================================="
echo "  Running Liquibase migration for Autoparts Project"
echo "====================================================="
echo "This script will:"
echo " 1. Create users table if not exists"
echo " 2. Add admin users"
echo " 3. Create products, orders and other necessary tables"
echo " 4. Add sample data"
echo "====================================================="
echo ""

cd /Applications/development/autoparts/autoparts_backend
echo "Starting migration..."
./mvnw liquibase:update

RESULT=$?
if [ $RESULT -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "You can now log in with:"
  echo "  Email: admin@example.com"
  echo "  Password: admin123 (or the original password for this account)"
  echo ""
  echo "Alternative admin account:"
  echo "  Email: admin@autoparts.local"
  echo "  Password: (the original password for this account)"
else
  echo ""
  echo "❌ Migration failed with error code: $RESULT"
  echo "Please check the logs for more details."
fi

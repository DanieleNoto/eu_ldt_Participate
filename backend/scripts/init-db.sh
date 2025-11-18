# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
#   Denis Vasilev Dimchev
#   Gianfranco Cedro
#!/bin/sh

# Script to initialize the database before starting the backend
# This script creates the database if it doesn't exist

set -e

echo "Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be available
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USERNAME" -d "postgres" -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - checking if database exists..."

# Check if database exists, create if it doesn't
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USERNAME" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USERNAME" -d "postgres" -c "CREATE DATABASE $DB_NAME"

echo "Database created - checking if schema exists..."

# Create schema if it doesn't exist
if [ -n "$DB_SCHEMA" ] && [ "$DB_SCHEMA" != "public" ]; then
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USERNAME" -d "$DB_NAME" -c "CREATE SCHEMA IF NOT EXISTS $DB_SCHEMA"
  echo "Schema '$DB_SCHEMA' is ready!"
fi

echo "Database is ready!"

# Start the application
exec "$@"

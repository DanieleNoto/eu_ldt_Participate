#!/bin/sh

# Script to initialize the database before starting the backend
# This script creates the database if it doesn't exist

set -e

echo "Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be available
until PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USERNAME" -d "postgres" -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - checking if database exists..."

# Check if database exists, create if it doesn't
PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USERNAME" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '$DATABASE_NAME'" | grep -q 1 || \
PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USERNAME" -d "postgres" -c "CREATE DATABASE $DATABASE_NAME"

echo "Database is ready!"

# Start the application
exec "$@"

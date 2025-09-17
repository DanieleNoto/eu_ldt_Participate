#!/bin/bash

# Script to apply all Decidim configurations
# Run with: bash apply-decidim-k8s.sh

# Set the namespace
NAMESPACE=participate

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE 2>/dev/null || true

echo "Applying Decidim configurations..."

# Apply configurations in order
echo "Creating ConfigMap and Secret..."
kubectl apply -f "$SCRIPT_DIR/decidim-configmap.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/decidim-secrets.yml" -n $NAMESPACE

echo "Creating PersistentVolumeClaims..."
kubectl apply -f "$SCRIPT_DIR/bundle-cache-pvc.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/node-modules-pvc.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/vendor-bundle-pvc.yml" -n $NAMESPACE

echo "Deploying PostgreSQL database..."
kubectl apply -f "$SCRIPT_DIR/db/postgres-service.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/db/postgres-statefulset.yml" -n $NAMESPACE

echo "Deploying Redis..."
kubectl apply -f "$SCRIPT_DIR/redis/redis-pvc.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/redis/redis-service.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/redis/redis-deployment.yml" -n $NAMESPACE

echo "Deploying Decidim application..."
kubectl apply -f "$SCRIPT_DIR/decidim-service.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/decidim-deployment.yml" -n $NAMESPACE

echo "Configuration completed!"
echo "You can check the status with: kubectl -n $NAMESPACE get pods | grep -E 'decidim|postgres|redis'"
echo "Access Decidim at: decidim.participate.local"

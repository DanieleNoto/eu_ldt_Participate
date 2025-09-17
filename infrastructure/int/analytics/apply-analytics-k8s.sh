#!/bin/bash

# Script to apply all Analytics configurations (Matomo and Grafana)
# Run with: bash apply-analytics-k8s.sh

# Set the namespace
NAMESPACE=participate

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE 2>/dev/null || true

echo "Applying Analytics configurations..."

# Apply Matomo configurations
echo "Deploying Matomo..."
echo "Creating Matomo ConfigMap and Secret..."
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-configmap.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-secret.yml" -n $NAMESPACE

echo "Creating Matomo PersistentVolumeClaims..."
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-pvc.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-db-pvc.yml" -n $NAMESPACE

echo "Deploying Matomo Database..."
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-db-deployment.yml" -n $NAMESPACE

echo "Deploying Matomo Application..."
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-service.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-deployment.yml" -n $NAMESPACE

# Apply Grafana configurations
echo "Deploying Grafana..."
echo "Creating Grafana ConfigMap and Secret..."
kubectl apply -f "$SCRIPT_DIR/grafana/grafana-configmap.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/grafana/grafana-secret.yml" -n $NAMESPACE

echo "Creating Grafana PersistentVolumeClaim..."
kubectl apply -f "$SCRIPT_DIR/grafana/grafana-pvc.yml" -n $NAMESPACE

echo "Deploying Grafana Application..."
kubectl apply -f "$SCRIPT_DIR/grafana/grafana-service.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/grafana/grafana-deployment.yml" -n $NAMESPACE

echo "Analytics configuration completed!"
echo "You can check the status with: kubectl -n $NAMESPACE get pods | grep -E 'matomo|grafana'"
echo "Access Matomo at: matomo.participate.local"
echo "Access Grafana at: grafana.participate.local"

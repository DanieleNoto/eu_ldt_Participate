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
echo "Applying Matomo ConfigMap and Secret if present..."
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-configmap.yml" -n $NAMESPACE || true
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-secret.yml" -n $NAMESPACE || true

echo "Applying Matomo StatefulSets / Services..."
# matomo uses statefulsets in this repo
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-db-statefulset.yaml" -n $NAMESPACE || true
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-statefulset.yaml" -n $NAMESPACE || true
kubectl apply -f "$SCRIPT_DIR/matomo/matomo-service.yaml" -n $NAMESPACE || true

# Apply Grafana configurations
echo "Deploying Grafana..."
echo "Applying Grafana ConfigMap and Secret if present..."
kubectl apply -f "$SCRIPT_DIR/grafana/grafana-configmap.yml" -n $NAMESPACE || true
kubectl apply -f "$SCRIPT_DIR/grafana/grafana-secret.yml" -n $NAMESPACE || true

echo "Applying Grafana StatefulSet / Service / Storage..."
kubectl apply -f "$SCRIPT_DIR/grafana/grafana-storage.yaml" -n $NAMESPACE || true
kubectl apply -f "$SCRIPT_DIR/grafana/grafana-statefulset.yaml" -n $NAMESPACE || true
kubectl apply -f "$SCRIPT_DIR/grafana/grafana-service.yaml" -n $NAMESPACE || true

echo "Analytics configuration completed!"
echo "You can check the status with: kubectl -n $NAMESPACE get pods | grep -E 'matomo|grafana'"
echo "Access Matomo at: matomo.participate.local"
echo "Access Grafana at: grafana.participate.local"

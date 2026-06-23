#!/bin/bash

# Script to apply Decidim (app), DB and Redis k8s manifests
# Run with: bash apply-decidim-k8s.sh

set -euo pipefail

# Namespace to use
NAMESPACE=participate

# Directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create namespace if it doesn't exist
kubectl create namespace "$NAMESPACE" 2>/dev/null || true

echo "Applying Decidim resources in namespace $NAMESPACE"

echo "Applying Decidim ConfigMap and Secret (if present)..."
kubectl apply -f "$SCRIPT_DIR/decidim-configmap.yml" -n "$NAMESPACE" || true
kubectl apply -f "$SCRIPT_DIR/decidim-secret.yml" -n "$NAMESPACE" || true

echo "Applying Decidim StatefulSet and Service (if present)..."
kubectl apply -f "$SCRIPT_DIR/decidim-statefulset.yaml" -n "$NAMESPACE" || true
kubectl apply -f "$SCRIPT_DIR/decidim-service.yaml" -n "$NAMESPACE" || true

echo "Applying DB resources (db-*) in $SCRIPT_DIR/db"
kubectl apply -f "$SCRIPT_DIR/db/db-configmap.yml" -n "$NAMESPACE" || true
kubectl apply -f "$SCRIPT_DIR/db/db-secret.yml" -n "$NAMESPACE" || true
kubectl apply -f "$SCRIPT_DIR/db/db-service.yaml" -n "$NAMESPACE" || true
kubectl apply -f "$SCRIPT_DIR/db/db-statefulset.yaml" -n "$NAMESPACE" || true

echo "Applying Redis resources (redis-*) in $SCRIPT_DIR/redis"
kubectl apply -f "$SCRIPT_DIR/redis/redis-service.yaml" -n "$NAMESPACE" || true
kubectl apply -f "$SCRIPT_DIR/redis/redis-statefulset.yaml" -n "$NAMESPACE" || true

echo "Decidim deployment apply completed. Check pods with: kubectl -n $NAMESPACE get pods | grep decidim -A5"

echo "If you changed Secrets (like SECRET_KEY_BASE), make sure to rollout restart the StatefulSet to pick them up:"
echo "  kubectl rollout restart statefulset/decidim -n $NAMESPACE"

echo "Done."

#!/bin/bash

# Script to apply all Jitsi configurations (ConfigMap, Secret, StatefulSets, Services, Ingress)
# Run with: bash apply-jitsi-k8s.sh

NAMESPACE=participate
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

kubectl create namespace $NAMESPACE 2>/dev/null || true

echo "Applying Jitsi configurations..."

# Apply Jitsi ConfigMap and Secret
kubectl apply -f "$SCRIPT_DIR/jitsi-configmap.yml" -n $NAMESPACE || true
kubectl apply -f "$SCRIPT_DIR/jitsi-secret.yml" -n $NAMESPACE || true

# Apply StatefulSets
kubectl apply -f "$SCRIPT_DIR/jitsi-web-statefulset.yaml" -n $NAMESPACE || true
kubectl apply -f "$SCRIPT_DIR/jitsi-jicofo-statefulset.yaml" -n $NAMESPACE || true
kubectl apply -f "$SCRIPT_DIR/jitsi-jvb-statefulset.yaml" -n $NAMESPACE || true
kubectl apply -f "$SCRIPT_DIR/jitsi-prosody-statefulset.yaml" -n $NAMESPACE || true

# Apply Services
kubectl apply -f "$SCRIPT_DIR/jitsi-web-service.yaml" -n $NAMESPACE || true

# Nginx configuration is now included in the main jitsi-configmap.yml

# Apply Ingress (entrypoint for Jitsi)
INGRESS_PATH="$SCRIPT_DIR/../proxy/jitsi-ingress.yml"
kubectl apply -f "$INGRESS_PATH" -n $NAMESPACE || true

# Restart jitsi-web pod to pick up the new nginx configuration
kubectl rollout restart statefulset/jitsi-web -n $NAMESPACE || true

echo "Jitsi configuration completed!"
echo "You can check the status with: kubectl -n $NAMESPACE get pods | grep jitsi"
echo "Access Jitsi at: https://part-int.ldttoolbox.app/jitsi/"

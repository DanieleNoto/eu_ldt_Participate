#!/bin/bash

# Script to apply all Jitsi configurations
# Run with: bash apply-jitsi-k8s.sh

# Set the namespace
NAMESPACE=participate

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE 2>/dev/null || true

echo "Applying Jitsi configurations..."

# Apply configurations in order
echo "Creating ConfigMap and Secret..."
kubectl apply -f "$SCRIPT_DIR/jitsi-configmap.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/jitsi-secrets.yml" -n $NAMESPACE

echo "Creating PersistentVolumeClaims..."
kubectl apply -f "$SCRIPT_DIR/jitsi-pvc.yml" -n $NAMESPACE

echo "Deploying Prosody (XMPP server)..."
kubectl apply -f "$SCRIPT_DIR/jitsi-prosody-deployment.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/jitsi-prosody-service.yml" -n $NAMESPACE

echo "Deploying Jicofo..."
kubectl apply -f "$SCRIPT_DIR/jitsi-jicofo-deployment.yml" -n $NAMESPACE

echo "Deploying JVB (Videobridge)..."
kubectl apply -f "$SCRIPT_DIR/jitsi-jvb-deployment.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/jitsi-jvb-service.yml" -n $NAMESPACE

echo "Deploying Web frontend..."
kubectl apply -f "$SCRIPT_DIR/jitsi-web-deployment.yml" -n $NAMESPACE
kubectl apply -f "$SCRIPT_DIR/jitsi-web-service.yml" -n $NAMESPACE

echo "Creating Ingress..."
kubectl apply -f "$SCRIPT_DIR/jitsi-ingress.yml" -n $NAMESPACE

echo "Configuration completed!"
echo "Add 'jitsi.participate.local' to your /etc/hosts file to access Jitsi."
echo "You can check the status with: kubectl -n $NAMESPACE get pods | grep jitsi"
echo "You can check the status with: kubectl -n $NAMESPACE get pods | grep jitsi"

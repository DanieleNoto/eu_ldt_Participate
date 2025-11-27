#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# Main script to apply all Kubernetes configurations
# This script applies configurations for all components in the correct order:
# 1. Decidim and its dependencies (PostgreSQL, Redis)
# 2. Analytics (Matomo, Grafana)
# 3. Jitsi Meet

# Set script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create namespace
NAMESPACE=participate
kubectl create namespace $NAMESPACE 2>/dev/null || true

echo "===== EU LDT Participate Platform Deployment ====="
echo "Target namespace: $NAMESPACE"

# Function to wait for pods to be ready
wait_for_pods() {
  local label=$1
  local timeout=300  # 5 minutes timeout
  local start_time=$(date +%s)
  
  echo "Waiting for $label pods to be ready..."
  
  while true; do
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))
    
    if [ $elapsed -gt $timeout ]; then
      echo "Timeout waiting for $label pods to be ready!"
      return 1
    fi
    
    local not_ready=$(kubectl -n $NAMESPACE get pods -l $label 2>/dev/null | grep -v "STATUS" | grep -v "Running" | grep -v "Completed" | wc -l)
    
    if [ "$not_ready" -eq 0 ]; then
      local running_pods=$(kubectl -n $NAMESPACE get pods -l $label 2>/dev/null | grep -v "STATUS" | wc -l)
      if [ "$running_pods" -gt 0 ]; then
        echo "$label pods are ready!"
        return 0
      fi
    fi
    
    echo "Waiting for $label pods to be ready... ($elapsed seconds elapsed)"
    sleep 5
  done
}

# Apply Decidim and dependencies
echo "Deploying Decidim and dependencies..."
"$SCRIPT_DIR/infrastructure/int/decidim/apply-decidim-k8s.sh"

# Wait for Decidim to be ready
wait_for_pods "app=decidim"
wait_for_pods "app=decidim-postgres"
wait_for_pods "app=decidim-redis"

# Apply Analytics (Matomo and Grafana)
echo "Deploying Analytics (Matomo and Grafana)..."
"$SCRIPT_DIR/infrastructure/int/analytics/apply-analytics-k8s.sh"

# Wait for Analytics to be ready
wait_for_pods "app=matomo"
wait_for_pods "app=grafana"

# Apply Jitsi
echo "Deploying Jitsi Meet..."
"$SCRIPT_DIR/infrastructure/int/jitsi/apply-jitsi-k8s.sh"

# Wait for Jitsi to be ready
wait_for_pods "app=jitsi"

echo "===== Deployment Complete! ====="
echo "Access your applications at:"
echo "- Decidim: http://decidim.participate.local"
echo "- Matomo: http://matomo.participate.local"
echo "- Grafana: http://grafana.participate.local"
echo "- Jitsi: http://jitsi.participate.local"
echo ""
echo "Make sure to add these entries to your /etc/hosts file for local development."
echo "To check the status of all components, run: kubectl -n $NAMESPACE get pods"

#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
#
# STEP 1 — Create a local Kind cluster with nginx ingress (ports 80/443 on localhost).
# Reads configuration from cicd/local/.env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../.env"
KIND_CONFIG="${SCRIPT_DIR}/kind-config.yaml"

if [[ -z "${NAMESPACE:-}" ]] && [[ -f "${ENV_FILE}" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${ENV_FILE}"
    set +a
fi

KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-participate-local}"
INGRESS_MANIFEST_URL="${INGRESS_MANIFEST_URL:-https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/kind/deploy.yaml}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()  { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}=============================================="
echo -e "  STEP 1 - INITIALIZE KIND CLUSTER"
echo -e "==============================================${NC}"
echo ""

for cmd in kind kubectl docker; do
    command -v "${cmd}" &>/dev/null || err "${cmd} is not installed or not in PATH"
done
ok "Prerequisites: kind, kubectl, docker"

echo ""
echo "  Applying kernel limits (optional)..."
sudo sysctl -w fs.inotify.max_user_watches=1048576 >/dev/null 2>&1 || true
sudo sysctl -w fs.inotify.max_user_instances=8192  >/dev/null 2>&1 || true
sudo sysctl -w fs.file-max=1048576                 >/dev/null 2>&1 || true
ok "Kernel limits applied"

[[ -f "${KIND_CONFIG}" ]] || err "Kind config not found: ${KIND_CONFIG}"

echo ""
echo "  Configuration:"
echo "    Cluster: ${KIND_CLUSTER_NAME}"
echo "    Config:  ${KIND_CONFIG}"
echo ""

if kind get clusters 2>/dev/null | grep -qx "${KIND_CLUSTER_NAME}"; then
    warn "Kind cluster '${KIND_CLUSTER_NAME}' already exists — skipping create"
else
    echo "  Creating Kind cluster..."
    kind create cluster --name "${KIND_CLUSTER_NAME}" --config "${KIND_CONFIG}" --wait 300s
    ok "Kind cluster created"
fi

kubectl cluster-info --context "kind-${KIND_CLUSTER_NAME}" >/dev/null 2>&1 \
    || err "kubectl cannot reach cluster kind-${KIND_CLUSTER_NAME}"

echo ""
echo "  Installing nginx ingress controller for Kind..."
kubectl --context "kind-${KIND_CLUSTER_NAME}" apply -f "${INGRESS_MANIFEST_URL}"

echo "  Waiting for ingress-nginx controller..."
kubectl --context "kind-${KIND_CLUSTER_NAME}" wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=300s

echo ""
echo "  Enabling snippet annotations in ingress-nginx (required for server-snippet / configuration-snippet)..."
kubectl --context "kind-${KIND_CLUSTER_NAME}" patch configmap ingress-nginx-controller \
    -n ingress-nginx \
    --type merge \
    -p '{"data":{"allow-snippet-annotations":"true"}}'
kubectl --context "kind-${KIND_CLUSTER_NAME}" rollout restart deployment ingress-nginx-controller \
    -n ingress-nginx
kubectl --context "kind-${KIND_CLUSTER_NAME}" rollout status deployment ingress-nginx-controller \
    -n ingress-nginx --timeout=120s
ok "Snippet annotations enabled"

echo ""
echo "  Installing local-path storage provisioner (PVC support for Grafana, etc.)..."
LOCAL_PATH_MANIFEST_URL="${LOCAL_PATH_MANIFEST_URL:-https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.30/deploy/local-path-storage.yaml}"
kubectl --context "kind-${KIND_CLUSTER_NAME}" apply -f "${LOCAL_PATH_MANIFEST_URL}"

# Charts reference storageClassName: default — alias it to local-path on Kind.
kubectl --context "kind-${KIND_CLUSTER_NAME}" patch storageclass local-path \
    -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}' \
    2>/dev/null || true

kubectl --context "kind-${KIND_CLUSTER_NAME}" apply -f - <<'EOF'
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: default
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: rancher.io/local-path
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
EOF
ok "StorageClass 'default' ready (local-path provisioner)"

echo ""
kubectl --context "kind-${KIND_CLUSTER_NAME}" cluster-info
echo ""
ok "Step 1 complete — ingress available on http://127.0.0.1:80 and https://127.0.0.1:443"

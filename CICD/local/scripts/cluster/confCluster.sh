#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
#
# Configure an existing Kubernetes cluster before deploy.
# Called by the EU LDT Toolbox central installer (HAS_CLUSTER=true / onpremise mode)
# or directly as part of a manual on-premise flow.
#
# KUBE_CONTEXT is exported by the installer; falls back to kind-<KIND_CLUSTER_NAME>
# so the script also works standalone via deploy.sh.
# Reads configuration from cicd/local/.env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../.env"

if [[ -f "${ENV_FILE}" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${ENV_FILE}"
    set +a
fi

KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-participate-local}"
# Respect KUBE_CONTEXT exported by the Toolbox installer; fall back to Kind default.
KUBE_CONTEXT="${KUBE_CONTEXT:-kind-${KIND_CLUSTER_NAME}}"
NAMESPACE="${NAMESPACE:-participate}"
REGISTRY="${REGISTRY:-registry.local}"
ACR_USERNAME="${ACR_USERNAME:-euldtshared}"
ACR_ENABLED="${ACR_ENABLED:-false}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err()  { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}=============================================="
echo -e "  CONFIGURE EXISTING CLUSTER"
echo -e "==============================================${NC}"
echo ""

command -v kubectl &>/dev/null || err "kubectl is not installed or not in PATH"

kubectl config get-contexts --output=name 2>/dev/null | grep -qx "${KUBE_CONTEXT}" \
    || err "kubectl context '${KUBE_CONTEXT}' not found — check KUBE_CONTEXT or kubeconfig"

kubectl --context "${KUBE_CONTEXT}" cluster-info &>/dev/null \
    || err "kubectl cannot reach context '${KUBE_CONTEXT}'"

ok "Cluster reachable (context: ${KUBE_CONTEXT})"

echo ""
echo "  Ensuring namespace '${NAMESPACE}'..."
if kubectl --context "${KUBE_CONTEXT}" get namespace "${NAMESPACE}" &>/dev/null; then
    ok "Namespace '${NAMESPACE}' already exists"
else
    kubectl --context "${KUBE_CONTEXT}" create namespace "${NAMESPACE}"
    ok "Namespace '${NAMESPACE}' created"
fi

kubectl --context "${KUBE_CONTEXT}" label namespace "${NAMESPACE}" \
    app=eu-ldt-participate managed-by=helm --overwrite &>/dev/null || true
ok "Namespace labels applied"

if [[ "${ACR_ENABLED}" == "true" ]]; then
    echo ""
    echo "  ACR_ENABLED=true — ensuring image pull secret..."
    [[ -n "${ACR_PASSWORD:-}" ]] || err "ACR_PASSWORD must be set in .env when ACR_ENABLED=true"

    kubectl --context "${KUBE_CONTEXT}" -n "${NAMESPACE}" create secret docker-registry acr-secret \
        --docker-server="${REGISTRY}" \
        --docker-username="${ACR_USERNAME}" \
        --docker-password="${ACR_PASSWORD}" \
        --dry-run=client -o yaml \
        | kubectl --context "${KUBE_CONTEXT}" apply -f -
    ok "Secret acr-secret applied in namespace ${NAMESPACE}"
else
    warn "ACR_ENABLED=false — skipping acr-secret (set ACR_ENABLED=true in .env to enable)"
fi

echo ""
echo "  Configuration summary:"
echo "    Context   : ${KUBE_CONTEXT}"
echo "    Namespace : ${NAMESPACE}"
echo "    Registry  : ${REGISTRY} (pull secret: ${ACR_ENABLED})"
echo ""
ok "Cluster configuration complete"

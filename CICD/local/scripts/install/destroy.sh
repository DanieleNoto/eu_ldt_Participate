#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
#
# Destroy: Helm release, namespace, generated values, /etc/hosts entries, Kind cluster.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${LOCAL_DIR}/.env"
VALUES_FILE="${LOCAL_DIR}/values-local.yaml"

if [[ -z "${NAMESPACE:-}" ]] && [[ -f "${ENV_FILE}" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${ENV_FILE}"
    set +a
fi

KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-participate-local}"
KIND_NODE_CONTAINER="${KIND_CLUSTER_NAME}-control-plane"
KUBE_CONTEXT="kind-${KIND_CLUSTER_NAME}"
RELEASE_NAME="${RELEASE_NAME:-eu-ldt-participate}"
NAMESPACE="${NAMESPACE:-participate}"

PARTICIPATE_HOST="${PARTICIPATE_HOST:-}"
JITSI_HOST="${JITSI_HOST:-}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DESTROY_ERRORS=0

ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; DESTROY_ERRORS=$((DESTROY_ERRORS + 1)); }

kubectl_reachable() {
    kubectl --context "${KUBE_CONTEXT}" cluster-info &>/dev/null 2>&1
}

kind_cluster_registered() {
    kind get clusters 2>/dev/null | grep -qx "${KIND_CLUSTER_NAME}"
}

kind_node_container_exists() {
    docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "${KIND_NODE_CONTAINER}"
}

remove_hosts_entry() {
    local hostname="$1"
    [[ -n "${hostname}" ]] || return 0
    if grep -qF "${hostname}" /etc/hosts 2>/dev/null; then
        sudo sed -i.bak "/[[:space:]]${hostname}\$/d" /etc/hosts 2>/dev/null \
            || sudo sed -i "/[[:space:]]${hostname}\$/d" /etc/hosts
        ok "/etc/hosts entry removed: ${hostname}"
    fi
}

destroy_kind_cluster() {
    local registered=false
    local container_exists=false

    if kind_cluster_registered; then
        registered=true
    fi
    if kind_node_container_exists; then
        container_exists=true
    fi

    if [[ "${registered}" != "true" && "${container_exists}" != "true" ]]; then
        warn "Kind cluster '${KIND_CLUSTER_NAME}' not found — skipping"
        return 0
    fi

    echo "  Deleting Kind cluster '${KIND_CLUSTER_NAME}'..."

    if [[ "${registered}" == "true" ]]; then
        if kind delete cluster --name "${KIND_CLUSTER_NAME}" 2>&1; then
            :
        else
            fail "kind delete cluster failed"
            echo "    Trying to remove Docker node container directly..."
            if docker rm -f -v "${KIND_NODE_CONTAINER}" 2>&1; then
                ok "Docker container '${KIND_NODE_CONTAINER}' removed"
            else
                fail "docker rm failed — restart Docker Desktop and run destroy again"
            fi
        fi
    elif [[ "${container_exists}" == "true" ]]; then
        warn "Kind registry has no cluster but container '${KIND_NODE_CONTAINER}' still exists"
        if docker rm -f -v "${KIND_NODE_CONTAINER}" 2>&1; then
            ok "Orphan Docker container removed"
        else
            fail "could not remove orphan container '${KIND_NODE_CONTAINER}'"
        fi
    fi

    # Verify cleanup
    local still_registered=false
    local still_container=false
    kind_cluster_registered && still_registered=true
    kind_node_container_exists && still_container=true

    if [[ "${still_registered}" == "true" || "${still_container}" == "true" ]]; then
        fail "Kind cluster '${KIND_CLUSTER_NAME}' was NOT fully removed"
        [[ "${still_registered}" == "true" ]] && echo "    • still listed in: kind get clusters"
        [[ "${still_container}" == "true" ]] && echo "    • container still present: ${KIND_NODE_CONTAINER}"
        echo "    Try: docker rm -f ${KIND_NODE_CONTAINER} && kind delete cluster --name ${KIND_CLUSTER_NAME}"
        return 1
    fi

    ok "Kind cluster deleted"
    return 0
}

echo ""
echo -e "${BLUE}=============================================="
echo -e "  DESTROY - EU LDT PARTICIPATE (KIND)"
echo -e "==============================================${NC}"
echo ""
echo -e "${YELLOW}  This will permanently delete:${NC}"
echo "    • Helm release '${RELEASE_NAME}' (namespace: ${NAMESPACE})"
echo "    • Namespace '${NAMESPACE}'"
echo "    • Kind cluster '${KIND_CLUSTER_NAME}'"
echo ""
read -rp "  Are you sure? (y/N): " confirm
echo ""

if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
    warn "Cancelled."
    exit 0
fi

if kubectl_reachable; then
    if helm --kube-context "${KUBE_CONTEXT}" list -n "${NAMESPACE}" -q --all 2>/dev/null | grep -qx "${RELEASE_NAME}"; then
        echo "  Uninstalling Helm release '${RELEASE_NAME}'..."
        if helm uninstall "${RELEASE_NAME}" --namespace "${NAMESPACE}" --kube-context "${KUBE_CONTEXT}" --wait 2>/dev/null; then
            ok "Helm release uninstalled"
        else
            warn "Helm uninstall failed — continuing cleanup"
        fi
    else
        warn "Helm release '${RELEASE_NAME}' not found — skipping"
    fi

    if kubectl --context "${KUBE_CONTEXT}" get namespace "${NAMESPACE}" &>/dev/null 2>&1; then
        echo "  Force-deleting all resources in '${NAMESPACE}'..."
        kubectl --context "${KUBE_CONTEXT}" delete all --all -n "${NAMESPACE}" \
            --grace-period=0 --force 2>/dev/null || true
        kubectl --context "${KUBE_CONTEXT}" delete pvc --all -n "${NAMESPACE}" \
            --grace-period=0 --force 2>/dev/null || true
        kubectl --context "${KUBE_CONTEXT}" delete secret --all -n "${NAMESPACE}" \
            --grace-period=0 --force 2>/dev/null || true
        kubectl --context "${KUBE_CONTEXT}" delete configmap --all -n "${NAMESPACE}" \
            --grace-period=0 --force 2>/dev/null || true
        ok "Resources deleted"

        echo "  Deleting namespace '${NAMESPACE}'..."
        if kubectl --context "${KUBE_CONTEXT}" delete namespace "${NAMESPACE}" --timeout=120s; then
            ok "Namespace deleted"
        else
            warn "Namespace deletion timed out — it may still be terminating"
        fi
    else
        warn "Namespace '${NAMESPACE}' not found — skipping"
    fi
else
    warn "kubectl cannot reach '${KUBE_CONTEXT}' — skipping Helm/namespace cleanup"
    warn "Will still attempt Kind cluster removal"
fi

if [[ -f "${VALUES_FILE}" ]]; then
    rm -f "${VALUES_FILE}"
    ok "values-local.yaml removed"
fi

remove_hosts_entry "${PARTICIPATE_HOST}"
remove_hosts_entry "${JITSI_HOST}"

destroy_kind_cluster || true

echo ""
if [[ "${DESTROY_ERRORS}" -gt 0 ]]; then
    fail "Destroy completed with ${DESTROY_ERRORS} error(s) — environment may be partially removed"
    echo ""
    echo "  If Docker reported 'input/output error', restart Docker Desktop and run ./deploy.sh down again."
    exit 1
fi

ok "Environment destroyed."
exit 0

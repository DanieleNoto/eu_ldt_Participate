#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
#
# STEP 3 — Generate values-local.yaml from .env and deploy via Helm.
#
# Chart:  infrastructure/chart/
# Values: cicd/local/values-local.yaml (auto-generated, do not commit)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PROJECT_ROOT="$(cd "${LOCAL_DIR}/../.." && pwd)"
ENV_FILE="${LOCAL_DIR}/.env"
CHART_DIR="${PROJECT_ROOT}/infrastructure/chart"
VALUES_FILE="${LOCAL_DIR}/values-local.yaml"
GENERATOR="${LOCAL_DIR}/generate-values-local.sh"

if [[ -z "${NAMESPACE:-}" ]] && [[ -f "${ENV_FILE}" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${ENV_FILE}"
    set +a
fi

KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-participate-local}"
KUBE_CONTEXT="kind-${KIND_CLUSTER_NAME}"
RELEASE_NAME="${RELEASE_NAME:-eu-ldt-participate}"
NAMESPACE="${NAMESPACE:-participate}"
HELM_WAIT="${HELM_WAIT:-true}"
HELM_TIMEOUT="${HELM_TIMEOUT:-10m}"

PARTICIPATE_HOST="${PARTICIPATE_HOST:-}"
JITSI_HOST="${JITSI_HOST:-}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()  { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

update_hosts_entry() {
    local hostname="$1"
    [[ -n "${hostname}" ]] || return 0
    local entry="127.0.0.1  ${hostname}"
    if grep -qF "${hostname}" /etc/hosts 2>/dev/null; then
        if grep -qF "${entry}" /etc/hosts; then
            ok "/etc/hosts already has ${hostname} → 127.0.0.1"
        else
            sudo sed -i.bak "/[[:space:]]${hostname}\$/c\\
${entry}" /etc/hosts 2>/dev/null \
                || sudo sed -i "/[[:space:]]${hostname}\$/c\\${entry}" /etc/hosts
            ok "/etc/hosts updated: ${entry}"
        fi
    else
        echo "${entry}" | sudo tee -a /etc/hosts >/dev/null
        ok "/etc/hosts entry added: ${entry}"
    fi
}

echo ""
echo -e "${BLUE}=============================================="
echo -e "  STEP 3 - HELM DEPLOY"
echo -e "==============================================${NC}"
echo ""

command -v helm &>/dev/null || err "helm is not installed"
[[ -f "${ENV_FILE}" ]] || err ".env not found at ${ENV_FILE}"
[[ -d "${CHART_DIR}" ]] || err "Chart not found at ${CHART_DIR}"
[[ -f "${GENERATOR}" ]] || err "Generator not found at ${GENERATOR}"
chmod +x "${GENERATOR}"

kubectl --context "${KUBE_CONTEXT}" cluster-info &>/dev/null \
    || err "kubectl cannot reach ${KUBE_CONTEXT} — run step 1 first"

echo "  Context    : ${KUBE_CONTEXT}"
echo "  Release    : ${RELEASE_NAME}"
echo "  Namespace  : ${NAMESPACE}"
echo "  Chart      : ${CHART_DIR}"
echo ""

echo "  Generating values-local.yaml..."
bash "${GENERATOR}" --env-file "${ENV_FILE}" --output "${VALUES_FILE}"
ok "values-local.yaml generated"

echo ""
echo "  Running helm upgrade --install..."
echo ""

helm_args=(
    upgrade --install "${RELEASE_NAME}" "${CHART_DIR}"
    --kube-context "${KUBE_CONTEXT}"
    --namespace "${NAMESPACE}"
    --create-namespace
    --debug
    -f "${CHART_DIR}/values.yaml"
    -f "${VALUES_FILE}"
)

if [[ "${HELM_WAIT}" == "true" ]]; then
    helm_args+=(--wait --timeout "${HELM_TIMEOUT}")
fi

helm "${helm_args[@]}"

echo ""
ok "Helm release deployed"

echo ""
update_hosts_entry "${PARTICIPATE_HOST}"
update_hosts_entry "${JITSI_HOST}"

echo ""
echo -e "${GREEN}=============================================="
echo -e "  ACCESS INFORMATION"
echo -e "==============================================${NC}"
echo ""
echo "  Ingress: http://127.0.0.1 (ports 80/443 forwarded from Kind)"
if [[ -n "${PARTICIPATE_HOST}" ]]; then
    echo "  Platform: http://${PARTICIPATE_HOST}/"
fi
if [[ -n "${JITSI_HOST}" ]]; then
    echo "  Jitsi:    http://${JITSI_HOST}/"
fi
echo ""
echo "  Uninstall: helm uninstall ${RELEASE_NAME} -n ${NAMESPACE} --kube-context ${KUBE_CONTEXT}"
echo ""
ok "Step 3 complete"

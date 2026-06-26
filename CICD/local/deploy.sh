#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
#
# EU LDT Participate — local deployment on Kind
# ==============================================================================
# Usage:
#   ./deploy.sh            Interactive menu
#   ./deploy.sh up         Full deployment (prerequisites → Kind → images → Helm)
#   ./deploy.sh down       Destroy everything (Helm + namespace + Kind cluster)
#   ./deploy.sh status     Pods, Helm release, ingress connectivity
#   ./deploy.sh 1|2|3      Individual steps
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="${SCRIPT_DIR}/scripts"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()  { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

ENV_FILE="${SCRIPT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
    err ".env file not found: ${ENV_FILE}"
    echo ""
    echo "  Create it from the example file:"
    echo "    cp ${SCRIPT_DIR}/.env.example ${ENV_FILE}"
    exit 1
fi

set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

run_step() {
    local script="${SCRIPTS_DIR}/$1"
    [[ -f "${script}" ]] || err "Script not found: ${script}"
    chmod +x "${script}"
    bash "${script}"
}

print_header() {
    echo ""
    echo -e "${BLUE}=============================================="
    echo -e "  $1"
    echo -e "==============================================${NC}"
    echo ""
}

do_up() {
    print_header "EU LDT PARTICIPATE - FULL DEPLOYMENT (KIND)"

    echo "  Cluster   : ${KIND_CLUSTER_NAME:-participate-local}"
    echo "  Namespace : ${NAMESPACE:-participate}"
    if [[ "${USE_LOCAL_IMAGES:-false}" == "true" ]]; then
        echo "  Images    : local Docker → Kind"
    else
        echo "  Images    : ACR (${REGISTRY:-registry.local})"
    fi
    echo ""

    run_step "install/validatePrerequisites.sh"
    run_step "cluster/createCluster.sh"
    run_step "cluster/validateCluster.sh"
    run_step "install/pullImages.sh"
    run_step "install/applyManifests.sh"

    echo ""
    ok "Deployment complete."
}

do_down() {
    print_header "EU LDT PARTICIPATE - DESTROY"
    run_step "install/destroy.sh"
}

do_status() {
    print_header "EU LDT PARTICIPATE - STATUS"

    NS="${NAMESPACE:-participate}"
    CLUSTER="${KIND_CLUSTER_NAME:-participate-local}"
    CTX="kind-${CLUSTER}"
    RELEASE="${RELEASE_NAME:-eu-ldt-participate}"

    HOST="${PARTICIPATE_HOST:-localhost}"

    echo -e "${BLUE}Kind:${NC}"
    if kind get clusters 2>/dev/null | grep -qx "${CLUSTER}"; then
        ok "Cluster '${CLUSTER}' exists"
    else
        warn "Cluster '${CLUSTER}' not found"
    fi

    echo ""
    echo -e "${BLUE}Helm release:${NC}"
    if helm --kube-context "${CTX}" status "${RELEASE}" -n "${NS}" 2>/dev/null; then
        :
    else
        warn "Release '${RELEASE}' not found in namespace '${NS}'"
    fi

    echo ""
    echo -e "${BLUE}Pods (${NS}):${NC}"
    kubectl --context "${CTX}" get pods -n "${NS}" 2>/dev/null || warn "Cannot list pods"

    echo ""
    echo -e "${BLUE}Ingress controller:${NC}"
    kubectl --context "${CTX}" get pods -n ingress-nginx 2>/dev/null || warn "ingress-nginx not reachable"

    echo ""
    echo -e "${BLUE}Quick connectivity (platform host):${NC}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Host: ${HOST}" \
        "http://127.0.0.1/" --max-time 5 2>/dev/null || echo "000")
    if [[ "${HTTP_CODE}" == "000" ]]; then
        warn "No response — ingress or pods may not be ready"
    else
        ok "Ingress responded: HTTP ${HTTP_CODE} (Host: ${HOST})"
    fi

    echo ""
    echo -e "${BLUE}Access:${NC}"
    echo "  Add to /etc/hosts: 127.0.0.1  ${HOST}"
    echo "  Open:              http://${HOST}/"
}

show_menu() {
    print_header "EU LDT PARTICIPATE - LOCAL (KIND)"

    echo "  Cluster   : ${KIND_CLUSTER_NAME:-participate-local}"
    echo "  Namespace : ${NAMESPACE:-participate}"
    echo ""
    echo "  1) Deploy   - Kind + pull images + Helm"
    echo "  2) Destroy  - Helm, namespace, Kind cluster"
    echo "  3) Status   - Pods, Helm, connectivity"
    echo ""
    echo "  Individual steps:"
    echo "     s0) Validate prerequisites"
    echo "     s1) Create Kind cluster + ingress"
    echo "     s2) Pull / load images into Kind"
    echo "     s3) Apply manifests (Helm)"
    echo ""
    echo "  q) Quit"
    echo ""
    read -rp "  Choice: " choice
    echo ""

    case "${choice}" in
        1) do_up ;;
        2) do_down ;;
        3) do_status ;;
        s0) run_step "install/validatePrerequisites.sh" ;;
        s1) run_step "cluster/createCluster.sh" ;;
        s2) run_step "install/pullImages.sh" ;;
        s3) run_step "install/applyManifests.sh" ;;
        q|Q) ok "Bye."; exit 0 ;;
        *) err "Unknown choice." ;;
    esac
}

case "${1:-menu}" in
    up|all) do_up ;;
    down) do_down ;;
    status) do_status ;;
    0|step0) run_step "install/validatePrerequisites.sh" ;;
    1|step1) run_step "cluster/createCluster.sh" ;;
    2|step2) run_step "install/pullImages.sh" ;;
    3|step3) run_step "install/applyManifests.sh" ;;
    menu) show_menu ;;
    --help|-h)
        echo "Usage: $0 [up|down|status|0|1|2|3]"
        echo ""
        echo "  up     - Full deployment (Kind + images + Helm)"
        echo "  down   - Destroy release, namespace, and Kind cluster"
        echo "  status - Show cluster, Helm, pods, HTTP probe"
        echo "  0-3    - Individual steps (prerequisites, Kind, images, Helm)"
        echo "  (no args) - Interactive menu"
        ;;
    *) err "Unknown argument: $1. Run '$0 --help'." ;;
esac

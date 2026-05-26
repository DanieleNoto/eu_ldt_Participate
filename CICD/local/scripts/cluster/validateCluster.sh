#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../.env"

if [[ -z "${KIND_CLUSTER_NAME:-}" ]] && [[ -f "${ENV_FILE}" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${ENV_FILE}"
    set +a
fi

KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-participate-local}"
KUBE_CONTEXT="kind-${KIND_CLUSTER_NAME}"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ok()  { echo -e "${GREEN}  ✓ $1${NC}"; }
err() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo "  Validating Kind cluster..."

kind get clusters 2>/dev/null | grep -qx "${KIND_CLUSTER_NAME}" \
    || err "Kind cluster '${KIND_CLUSTER_NAME}' not found — run createCluster.sh first"

kubectl --context "${KUBE_CONTEXT}" cluster-info &>/dev/null \
    || err "kubectl cannot reach context ${KUBE_CONTEXT}"

ok "Kind cluster '${KIND_CLUSTER_NAME}' reachable"

kubectl --context "${KUBE_CONTEXT}" get pods -n ingress-nginx \
    --selector=app.kubernetes.io/component=controller 2>/dev/null | grep -q Running \
    || err "ingress-nginx controller is not running"

ok "Ingress controller running"

#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
#
# STEP 2 — Pull application images and load them into the Kind cluster.
#
#   USE_LOCAL_IMAGES=true  → load images already present in the local Docker daemon
#   USE_LOCAL_IMAGES=false → docker login to ACR, pull, then kind load docker-image
#
# Reads configuration from cicd/local/.env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../.env"

if [[ -z "${NAMESPACE:-}" ]] && [[ -f "${ENV_FILE}" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${ENV_FILE}"
    set +a
fi

KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-participate-local}"
USE_LOCAL_IMAGES="${USE_LOCAL_IMAGES:-false}"
CONTAINER_IMAGE_TOOL_TAG="${CONTAINER_IMAGE_TOOL_TAG:-latest}"
REGISTRY="${REGISTRY:-euldtshared.azurecr.io}"
REPO_DECIDIM="${REPO_DECIDIM:-eu-ldt-part-int}"
REPO_CHATBOT_BE="${REPO_CHATBOT_BE:-eu-ldt-chatbot-be-int}"
REPO_CHATBOT_FE="${REPO_CHATBOT_FE:-eu-ldt-chatbot-fe-int}"
REPO_MATOMO="${REPO_MATOMO:-matomo-custom}"
ACR_USERNAME="${ACR_USERNAME:-euldtshared}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()  { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
err() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

load_image_into_kind() {
    local image="$1"
    echo "  Loading ${image} into Kind (${KIND_CLUSTER_NAME})..."
    kind load docker-image "${image}" --name "${KIND_CLUSTER_NAME}"
    ok "Loaded: ${image}"
    echo ""
}

echo ""
echo -e "${BLUE}=============================================="
echo -e "  STEP 2 - PULL CONTAINER IMAGES"
echo -e "==============================================${NC}"
echo ""

kind get clusters 2>/dev/null | grep -qx "${KIND_CLUSTER_NAME}" \
    || err "Kind cluster '${KIND_CLUSTER_NAME}' not found — run step 1 first"

if [[ "${USE_LOCAL_IMAGES}" == "true" ]]; then
    echo "  Mode: LOCAL (Docker daemon → Kind)"
    echo ""

    LOCAL_IMAGE_DECIDIM="${LOCAL_IMAGE_DECIDIM:-}"
    LOCAL_IMAGE_CHATBOT_BE="${LOCAL_IMAGE_CHATBOT_BE:-}"
    LOCAL_IMAGE_CHATBOT_FE="${LOCAL_IMAGE_CHATBOT_FE:-}"
    LOCAL_IMAGE_MATOMO="${LOCAL_IMAGE_MATOMO:-}"

    [[ -n "${LOCAL_IMAGE_DECIDIM}" ]] || err "LOCAL_IMAGE_DECIDIM must be set when USE_LOCAL_IMAGES=true"
    [[ -n "${LOCAL_IMAGE_CHATBOT_BE}" ]] || err "LOCAL_IMAGE_CHATBOT_BE must be set when USE_LOCAL_IMAGES=true"
    [[ -n "${LOCAL_IMAGE_CHATBOT_FE}" ]] || err "LOCAL_IMAGE_CHATBOT_FE must be set when USE_LOCAL_IMAGES=true"
    [[ -n "${LOCAL_IMAGE_MATOMO}" ]] || err "LOCAL_IMAGE_MATOMO must be set when USE_LOCAL_IMAGES=true"

    for image in \
        "${LOCAL_IMAGE_DECIDIM}" \
        "${LOCAL_IMAGE_CHATBOT_BE}" \
        "${LOCAL_IMAGE_CHATBOT_FE}" \
        "${LOCAL_IMAGE_MATOMO}"; do
        docker image inspect "${image}" &>/dev/null \
            || err "Image not found locally: ${image} — build or tag it first"
        load_image_into_kind "${image}"
    done
else
    echo "  Mode: ACR"
    echo ""

    [[ -n "${ACR_PASSWORD:-}" ]] || err "ACR_PASSWORD must be set in .env"
    [[ -n "${CONTAINER_IMAGE_TOOL_TAG}" ]] || err "CONTAINER_IMAGE_TOOL_TAG must be set in .env"

    IMAGES=(
        "${REGISTRY}/${REPO_DECIDIM}:${CONTAINER_IMAGE_TOOL_TAG}"
        "${REGISTRY}/${REPO_CHATBOT_BE}:${CONTAINER_IMAGE_TOOL_TAG}"
        "${REGISTRY}/${REPO_CHATBOT_FE}:${CONTAINER_IMAGE_TOOL_TAG}"
        "${REGISTRY}/${REPO_MATOMO}:${CONTAINER_IMAGE_TOOL_TAG}"
    )

    echo "  Registry: ${REGISTRY}"
    echo "  Tag:      ${CONTAINER_IMAGE_TOOL_TAG}"
    echo ""

    echo "  Logging in to ${REGISTRY}..."
    echo "${ACR_PASSWORD}" | docker login "${REGISTRY}" \
        --username "${ACR_USERNAME}" --password-stdin
    ok "Logged in to registry"
    echo ""

    for image in "${IMAGES[@]}"; do
        echo "  Pulling ${image}..."
        docker pull "${image}"
        load_image_into_kind "${image}"
    done
fi

ok "Step 2 complete"

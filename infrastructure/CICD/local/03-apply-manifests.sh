#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors: Gianfranco Cedro
#
# Local Helm deployment script.
# Usage: cd infrastructure/CICD/local && cp .env.example .env && vim .env && ./03-apply-manifests.sh
#
# Flow: .env → generate-values-local.py → values-local.yaml → helm upgrade --install

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
VALUES_LOCAL="${SCRIPT_DIR}/values-local.yaml"
CHART_DIR="${REPO_ROOT}/infrastructure/chart"
RELEASE_NAME="${RELEASE_NAME:-eu-ldt-participate}"
NAMESPACE="${NAMESPACE:-participate}"

[[ -f "${ENV_FILE}" ]] || { echo "ERROR: ${ENV_FILE} not found. Copy .env.example to .env and fill values."; exit 1; }
[[ -d "${CHART_DIR}" ]] || { echo "ERROR: Chart not found at ${CHART_DIR}"; exit 1; }

echo "→ Generating values-local.yaml from ${ENV_FILE}..."
python3 "${SCRIPT_DIR}/generate-values-local.py" --env-file "${ENV_FILE}" --output "${VALUES_LOCAL}"

echo "→ Running helm upgrade --install..."
helm upgrade --install "${RELEASE_NAME}" "${CHART_DIR}" \
  --namespace "${NAMESPACE}" \
  --create-namespace \
  -f "${CHART_DIR}/values.yaml" \
  -f "${VALUES_LOCAL}"

echo "✅ Done. Release '${RELEASE_NAME}' deployed to namespace '${NAMESPACE}'."
echo "   Uninstall: helm uninstall ${RELEASE_NAME} --namespace ${NAMESPACE}"

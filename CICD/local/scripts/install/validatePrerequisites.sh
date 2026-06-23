#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0

set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
err()  { echo -e "${RED}  ✗ $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }

echo "  Validating prerequisites..."
echo ""

FAIL=0

check_cmd() {
    local cmd="$1"
    local hint="${2:-}"
    if command -v "$cmd" &>/dev/null; then
        local ver
        ver=$(  "$cmd" version 2>/dev/null | head -1 \
             || "$cmd" --version 2>/dev/null | head -1 \
             || echo "unknown")
        ok "$cmd  →  $ver"
    else
        err_msg="$cmd is not installed or not in PATH"
        [ -n "$hint" ] && err_msg="$err_msg  (hint: $hint)"
        echo -e "${RED}  ✗ $err_msg${NC}"
        FAIL=1
    fi
}

check_cmd kind    "https://kind.sigs.k8s.io/docs/user/quick-start/#installation"
check_cmd kubectl "https://kubernetes.io/docs/tasks/tools/"
check_cmd docker  "https://docs.docker.com/get-docker/"
check_cmd helm    "https://helm.sh/docs/intro/install/"
check_cmd python3     ""

echo ""

if docker info &>/dev/null; then
    ok "Docker daemon is running"
else
    echo -e "${RED}  ✗ Docker daemon is not running — start Docker first${NC}"
    FAIL=1
fi

echo ""

if [ "$FAIL" -ne 0 ]; then
    echo -e "${RED}  One or more prerequisites are missing. Fix them and retry.${NC}"
    exit 1
fi

ok "All prerequisites satisfied"

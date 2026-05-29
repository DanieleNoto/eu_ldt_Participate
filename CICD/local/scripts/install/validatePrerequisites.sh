#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ok()  { echo -e "${GREEN}  ✓ $1${NC}"; }
err() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

echo "  Validating prerequisites..."

for cmd in kind kubectl docker helm python3; do
    command -v "${cmd}" &>/dev/null && ok "${cmd} found" || err "${cmd} is not installed or not in PATH"
done

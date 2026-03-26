#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors: Gianfranco Cedro
# Adapted from original gen-env-example.sh

set -euo pipefail

# --- Settings ---------------------------------------------------------------
TEMPLATE_DIR="${TEMPLATE_DIR:-../int}"   # where your _%VAR%_ templates live
EXAMPLE_FILE="${EXAMPLE_FILE:-./.env}"
PREFILL_FILE="${PREFILL_FILE:-../../.env.dev.example}"         # optional: existing .env to prefill values
                                         # (e.g. ../../.env.dev.example from docker-compose)

# --- K8s service defaults ---------------------------------------------------
# Variables that have well-known Kubernetes-internal defaults.
# Hyphen-separated names mirror the _%TEMPLATE-VAR%_ convention.
declare -A K8S_DEFAULTS=(
  # Decidim DB (k8s Service name: db)
  ["DATABASE-HOST-DECIDIM"]="db"
  # Redis (k8s Service name: redis)
  ["REDIS-URL"]="redis://redis:6379/0"
  # Grafana DB (k8s Service name: grafana-db)
  ["GF-DATABASE-HOST"]="grafana-db"
  ["GF-DATABASE-TYPE"]="postgres"
  # Matomo DB (k8s Service name: matomo-db-svc)
  ["MATOMO-DATABASE-HOST"]="matomo-db-svc"
  # Misc k8s runtime defaults
  ["RESTART-POLICY"]="always"
  ["QUEUE-ADAPTER"]="sidekiq"
  ["GRAFANA-PGDATA-PATH"]="/var/lib/postgresql/data/pgdata"
  ["KEYCLOAK-DISABLE-SSL-VERIFY"]="false"
  ["ENABLE-JSON-LOGS"]="true"
  ["RATE-LIMIT-MAX"]="100"
  ["RATE-LIMIT-TIME-WINDOW"]="1 minute"
  ["MAX-EVENT-LOOP-USE"]="0.98"
)

# --- Variables that MUST be set by the operator -----------------------------
# Secrets or externally-defined values: no safe default can be shipped.
# Format: ["VAR-NAME"]="human-readable hint for the operator"
declare -A REQUIRED_HINTS=(
  # Rails / Decidim secrets
  ["SECRET-KEY-BASE"]="Rails secret key — generate with: openssl rand -hex 64"
  ["DATABASE-PASSWORD-DECIDIM"]="PostgreSQL password for the Decidim database"
  ["DATABASE-USERNAME-DECIDIM"]="PostgreSQL user for the Decidim database"
  ["DATABASE-URL-DECIDIM"]="Full Postgres DSN for Decidim (postgres://user:pass@host:5432/db)"
  # Chatbot backend secrets
  ["DB-PASSWORD-CHATBOT"]="PostgreSQL password for the chatbot backend database"
  ["DB-USERNAME-CHATBOT"]="PostgreSQL user for the chatbot backend database"
  ["DATABASE-URL-CHATBOT"]="Full Postgres DSN for chatbot backend"
  ["CYPHER-SECRET"]="Encryption secret for chatbot backend (random string)"
  ["CYPHER-SALT"]="Encryption salt for chatbot backend (random string)"
  # Grafana secrets
  ["GF-SECURITY-ADMIN-PASSWORD"]="Grafana admin account password"
  ["GF-DATABASE-PASSWORD"]="PostgreSQL password for the Grafana database"
  # Keycloak / OAuth (Decidim)
  ["OMNIAUTH-KEYCLOAK-CLIENT-ID"]="Keycloak OAuth2 client ID for Decidim"
  ["OMNIAUTH-KEYCLOAK-CLIENT-SECRET"]="Keycloak OAuth2 client secret for Decidim"
  ["OMNIAUTH-KEYCLOAK-SITE"]="Keycloak base URL (e.g. https://keycloak.example.com)"
  ["OMNIAUTH-KEYCLOAK-REALM"]="Keycloak realm name"
  # Keycloak / OAuth (Grafana)
  ["GF-AUTH-GENERIC-OAUTH-CLIENT-ID"]="Keycloak OAuth2 client ID for Grafana"
  ["GF-AUTH-GENERIC-OAUTH-CLIENT-SECRET"]="Keycloak OAuth2 client secret for Grafana"
  ["GF-AUTH-GENERIC-OAUTH-AUTH-URL"]="Keycloak authorization endpoint URL"
  ["GF-AUTH-GENERIC-OAUTH-TOKEN-URL"]="Keycloak token endpoint URL"
  ["GF-AUTH-GENERIC-OAUTH-API-URL"]="Keycloak userinfo endpoint URL"
  ["GF-AUTH-GENERIC-OAUTH-SIGNOUT-REDIRECT-URL"]="Keycloak post-logout redirect URL"
  # SMTP credentials
  ["SMTP-ADDRESS"]="SMTP server hostname (e.g. smtp.example.com)"
  ["SMTP-PASSWORD"]="SMTP account password"
  ["SMTP-USERNAME"]="SMTP account username"
  ["SMTP-USER-NAME"]="SMTP account username (alias used by some services)"
  # Jitsi secrets
  ["JWT-APP-SECRET"]="JWT secret shared between Decidim and Jitsi"
  ["JVB-AUTH-PASSWORD"]="Jitsi Video Bridge auth password"
  ["JICOFO-AUTH-PASSWORD"]="Jitsi Focus Component auth password"
  # Matomo / MySQL secrets
  ["MATOMO-DATABASE-PASSWORD"]="MariaDB password for Matomo"
  ["MATOMO-TOKEN-AUTH"]="Matomo API authentication token"
  ["MYSQL-ROOT-PASSWORD"]="MariaDB root password for Matomo DB"
  ["MYSQL-PASSWORD"]="MariaDB password for the Matomo DB user"
  # Decidim DB name
  ["DATABASE-NAME-DECIDIM"]="PostgreSQL database name for Decidim"
  # Chatbot DB name
  ["DB-NAME-CHATBOT"]="PostgreSQL database name for the chatbot backend"
  # Mailer sender
  ["DECIDIM-MAILER-SENDER"]="From address for Decidim notification emails (e.g. noreply@example.com)"
  # Deployment / infrastructure
  ["CONTAINER_IMAGE_TOOL_TAG"]="Docker image tag to deploy (e.g. git tag v1.0.0)"
  ["PARTICIPATE-HOST"]="Public hostname for the Participate platform (e.g. participate.example.com)"
  ["JITSI-HOST"]="Public hostname for Jitsi (e.g. jitsi.example.com)"
  ["PUBLIC-URL"]="Full public URL for Jitsi (e.g. https://jitsi.example.com)"
  # External tool integrations
  ["TOOL0-DOMAIN"]="External tool 0 domain URL"
  ["TOOL0-FULL-URL"]="External tool 0 full URL"
  ["TOOL1-MAPS-URL"]="External tool 1 maps URL"
  ["TOOL2-EXPERIMENTS-URL"]="External tool 2 experiments URL"
  ["TOOL2-IFRAME-URL"]="External tool 2 iframe URL"
  ["HELP-URL"]="Help documentation URL"
)

# --- Helpers ----------------------------------------------------------------
die() { echo "ERROR: $*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

collect_vars_in() {
  # Collect unique _%VAR%_ tokens from a specific subdirectory
  local dir="$1"
  grep -Rho --exclude-dir='.git' '_%[A-Za-z0-9_\-]\+%_' "$dir" 2>/dev/null \
    | sed -E 's/^_%([A-Za-z0-9_\-]+)%_$/\1/' \
    | sort -u
}

collect_vars() {
  # Collect all unique _%VAR%_ tokens from TEMPLATE_DIR
  grep -Rho --exclude-dir='.git' '_%[A-Za-z0-9_\-]\+%_' "$TEMPLATE_DIR" 2>/dev/null \
    | sed -E 's/^_%([A-Za-z0-9_\-]+)%_$/\1/' \
    | sort -u
}

# k8s templates use hyphens; .env files use underscores — normalise for lookup
normalize_var() {
  echo "${1//-/_}"
}

is_placeholder() {
  # Returns 0 (true) if the value looks like a placeholder that must be replaced
  case "$1" in
    xxxx|xxx|xxxxx|""|changeme*|your_*|insecure_*) return 0 ;;
    *'${'*) return 0 ;;   # unexpanded shell variable reference
    *) return 1 ;;
  esac
}

prefill_lookup() {
  # Look up VAR in PREFILL_FILE with hyphen→underscore normalization.
  # Returns 1 if not found or the value is a placeholder.
  local var="$1"
  [[ -n "$PREFILL_FILE" && -f "$PREFILL_FILE" ]] || return 1
  local normalized
  normalized="$(normalize_var "$var")"
  local val
  val="$(awk -F= -v k="$normalized" '
    $0 !~ /^[[:space:]]*#/ && $1 ~ /^[[:space:]]*(export[[:space:]]+)?[A-Za-z0-9_-]+[[:space:]]*$/ {
      gsub(/^[[:space:]]*export[[:space:]]+/,"",$1);
      key=$1; sub(/[[:space:]]+$/, "", key);
      if (key==k) {
        sub(/^[^=]*=/, "", $0);
        print $0; exit 0
      }
    }' "$PREFILL_FILE")" || return 1
  is_placeholder "$val" && return 1
  echo "$val"
}

k8s_default_lookup() {
  local var="$1"
  # shellcheck disable=SC2154
  if [[ -v "K8S_DEFAULTS[$var]" ]]; then
    echo "${K8S_DEFAULTS[$var]}"
    return 0
  fi
  return 1
}

is_required() {
  # shellcheck disable=SC2154
  [[ -v "REQUIRED_HINTS[$1]" ]]
}

# --- Sections ---------------------------------------------------------------
# Ordered sections: "Label:subdirectory" (relative to TEMPLATE_DIR).
# Variables found in multiple sections are only emitted in the first one.
SECTIONS=(
  "Decidim Application:decidim"
  "Decidim Database:decidim/db"
  "Redis:decidim/redis"
  "Chatbot Backend:backend"
  "Chatbot Frontend:frontend"
  "Grafana:analytics/grafana"
  "Grafana Database:analytics/grafana/db"
  "Matomo:analytics/matomo"
  "Jitsi:jitsi"
  "Ingress / Proxy:proxy"
  "Webapp Deployment:webapp"
)

# --- Main -------------------------------------------------------------------
require_cmd grep
require_cmd sed
require_cmd sort
require_cmd awk

[[ -d "$TEMPLATE_DIR" ]] || die "Template directory not found: $TEMPLATE_DIR"

cnt_required=0
cnt_k8s=0
cnt_prefilled=0
cnt_empty=0

prefill_label="none"
[[ -n "$PREFILL_FILE" ]] && prefill_label="$(basename "$PREFILL_FILE")"

# Track emitted vars to avoid duplicates across groups
declare -A emitted=()

emit_section_vars() {
  # Emit all vars for one section grouped by category:
  #   prefilled → k8s default → required → empty
  local section_vars="$1"

  local -a prefilled_names=() k8s_names=() required_names=() empty_names=()
  local -A k8s_vals_map=() prefill_vals_map=()
  local var _val

  while IFS= read -r var; do
    [[ -z "$var" ]] && continue
    if is_required "$var"; then
      required_names+=("$var")
    elif _val="$(k8s_default_lookup "$var")"; then
      k8s_names+=("$var")
      k8s_vals_map["$var"]="$_val"
    elif _val="$(prefill_lookup "$var")"; then
      prefilled_names+=("$var")
      prefill_vals_map["$var"]="$_val"
    else
      empty_names+=("$var")
    fi
  done <<< "$section_vars"

  local has_prev=0

  if [[ ${#prefilled_names[@]} -gt 0 ]]; then
    echo "#   [prefilled from ${prefill_label}]"
    for var in "${prefilled_names[@]}"; do
      echo "${var}=${prefill_vals_map[$var]}"
      cnt_prefilled=$(( cnt_prefilled + 1 ))
    done
    has_prev=1
  fi

  if [[ ${#k8s_names[@]} -gt 0 ]]; then
    [[ $has_prev -eq 1 ]] && echo
    echo "#   [k8s default]"
    for var in "${k8s_names[@]}"; do
      echo "${var}=${k8s_vals_map[$var]}"
      cnt_k8s=$(( cnt_k8s + 1 ))
    done
    has_prev=1
  fi

  if [[ ${#required_names[@]} -gt 0 ]]; then
    [[ $has_prev -eq 1 ]] && echo
    echo "#   [REQUIRED]"
    for var in "${required_names[@]}"; do
      echo "#     ${REQUIRED_HINTS[$var]}"
      echo "${var}="
      cnt_required=$(( cnt_required + 1 ))
    done
    has_prev=1
  fi

  if [[ ${#empty_names[@]} -gt 0 ]]; then
    [[ $has_prev -eq 1 ]] && echo
    for var in "${empty_names[@]}"; do
      echo "${var}="
      cnt_empty=$(( cnt_empty + 1 ))
    done
  fi
}

{
  echo "# SPDX-License-Identifier: AGPL-3.0"
  echo "# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0"
  echo "# Authors: Gianfranco Cedro"
  echo "#"
  echo "# Autogenerated by generate-env-example.sh"
  echo "# Discovered in: $TEMPLATE_DIR"
  echo "# Fill the values and save as .env for rendering."
  echo "#"
  echo "# Legend:"
  echo "#   [REQUIRED]    – must be set before deploying; no safe default exists"
  echo "#   [k8s default] – pre-filled with a Kubernetes-internal service default"
  echo "#   [prefilled]   – value copied from ${prefill_label} (docker-compose reference)"
  echo "#"
  echo "# For detailed descriptions of each variable, see:"
  echo "#   infrastructure/scripts/ENVIRONMENT_VARIABLES_DESCRIPTIONS.md"

  for group in "${SECTIONS[@]}"; do
    label="${group%%:*}"
    subdir="${group#*:}"
    dir="${TEMPLATE_DIR}/${subdir}"

    [[ -d "$dir" ]] || continue

    group_vars="$(collect_vars_in "$dir" || true)"
    [[ -z "$group_vars" ]] && continue

    # Filter out already-emitted vars
    new_vars=""
    while IFS= read -r var; do
      [[ -v "emitted[$var]" ]] || new_vars+="${var}"$'\n'
    done <<< "$group_vars"
    new_vars="${new_vars%$'\n'}"
    [[ -z "$new_vars" ]] && continue

    echo
    echo "# ============================================================================"
    echo "# ${label^^}"
    echo "# ============================================================================"

    emit_section_vars "$new_vars"
    while IFS= read -r var; do
      emitted["$var"]=1
    done <<< "$new_vars"
  done

  # Emit any vars not covered by the groups above (safety net)
  all_vars="$(collect_vars || true)"
  leftover=""
  while IFS= read -r var; do
    [[ -v "emitted[$var]" ]] || leftover+="${var}"$'\n'
  done <<< "$all_vars"
  leftover="${leftover%$'\n'}"

  if [[ -n "$leftover" ]]; then
    echo
    echo "# ============================================================================"
    echo "# OTHER"
    echo "# ============================================================================"
    while IFS= read -r var; do
      [[ -z "$var" ]] && continue
      emitted["$var"]=1
    done <<< "$leftover"
    emit_section_vars "$leftover"
  fi
} > "$EXAMPLE_FILE"

total=$(collect_vars | grep -c .)
echo "✅ Generated $EXAMPLE_FILE with $total variables"
echo "   🔴 Required (operator must fill): $cnt_required"
echo "   🟢 K8s defaults applied:          $cnt_k8s"
echo "   🔵 Prefilled from ${prefill_label}: $cnt_prefilled"
echo "   ⚪ Empty (no default found):      $cnt_empty"
echo "📋 Found placeholders from: $TEMPLATE_DIR"
echo "💡 Fill the remaining values and save as .env for rendering"
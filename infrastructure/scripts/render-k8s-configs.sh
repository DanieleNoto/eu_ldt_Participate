#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors: Gianfranco Cedro
# Adapted from original render-k8s.sh

set -euo pipefail

# --- Settings ---------------------------------------------------------------
TEMPLATE_DIR="${TEMPLATE_DIR:-../int}"
OUT_DIR="${OUT_DIR:-infrastructure/local}"
ENV_FILE="${ENV_FILE:-.env}"
ALLOW_UNSET="${ALLOW_UNSET:-true}"

# --- Helpers ----------------------------------------------------------------
die() { echo "ERROR: $*" >&2; exit 1; }

require_cmd() { command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"; }

collect_vars_in_file() {
  local file="$1"
  grep -ho '_%[A-Za-z0-9_\-]\+%_' "$file" 2>/dev/null | sed -E 's/^_%([A-Za-z0-9_\-]+)%_$/\1/' | sort -u || true
}

env_value() {
  local k="$1"
  # Look up using the exact key from the template (no _/- conversion)
  local val
  val=$(awk -F= -v key="$k" '
    $0 !~ /^[[:space:]]*#/ && $1 ~ /^[[:space:]]*(export[[:space:]]+)?[A-Za-z0-9_-]+[[:space:]]*$/ {
      gsub(/^[[:space:]]*export[[:space:]]+/,"",$1);
      gsub(/[[:space:]]+$/, "", $1);
      if ($1==key) { sub(/^[^=]*=/, "", $0); print $0; exit 0 }
    }' "$ENV_FILE" 2>/dev/null || true)

  if [[ -n "$val" ]]; then
    echo "$val"
    return
  fi

  # Try common mappings
  case "$k" in
    "POSTGRES-USER") env_value "DATABASE_USERNAME" ;;
    "POSTGRES-PASSWORD") env_value "DATABASE_PASSWORD" ;;
    "POSTGRES-DATABASE"|"DB-NAME") env_value "DATABASE_NAME" ;;
    "DB-USERNAME") env_value "DATABASE_USERNAME" ;;
    "DB-PASSWORD") env_value "DATABASE_PASSWORD" ;;
    "CHATBOT-URL") env_value "CHATBOT_URL" ;;
    "CHATBOT-BACKEND-URL"|"VITE-API-URL") env_value "CHATBOT_BACKEND_URL" ;;
    "SMTP-USER-NAME"|"SMTP-USERNAME") env_value "SMTP_USER_NAME" ;;
    "DECIDIM-HOST") env_value "DECIDIM_HOST" ;;
    "DECIDIM-JITSI-URL") env_value "PUBLIC_URL" ;;
    "DECIDIM-MAILER-SENDER") env_value "DECIDIM_MAILER_SENDER" ;;
    "JWT-APP-ID") env_value "JITSI_APP_ID" ;;
    "JWT-APP-SECRET") env_value "JITSI_SECRET" ;;
    "JICOFO-AUTH-PASSWORD") env_value "JICOFO_AUTH_PASSWORD" ;;
    "JVB-AUTH-PASSWORD") env_value "JVB_AUTH_PASSWORD" ;;
    "JVB-STUN-SERVERS") env_value "JVB_STUN_SERVERS" ;;
    "OMNIAUTH-KEYCLOAK-CLIENT-ID") env_value "OMNIAUTH_KEYCLOAK_CLIENT_ID" ;;
    "OMNIAUTH-KEYCLOAK-CLIENT-SECRET") env_value "OMNIAUTH_KEYCLOAK_CLIENT_SECRET" ;;
    "OMNIAUTH-KEYCLOAK-REALM") env_value "OMNIAUTH_KEYCLOAK_REALM" ;;
    "OMNIAUTH-KEYCLOAK-SITE") env_value "OMNIAUTH_KEYCLOAK_SITE" ;;
    "MATOMO-SITE-ID") env_value "MATOMO_SITE_ID" ;;
    "MATOMO-SERVER-ADDRESS"|"MATOMO-ROOT-URL") env_value "MATOMO_SERVER_ADDRESS" ;;
    "MATOMO-TOKEN-AUTH") env_value "MATOMO_TOKEN_AUTH" ;;
    "MATOMO-DATABASE-HOST") val="$(env_value "MATOMO_DATABASE_HOST")"; echo "${val:-matomo-db-svc}" ;;
    "MATOMO-DATABASE-USERNAME"|"MYSQL-USER") env_value "MATOMO_DATABASE_USERNAME" ;;
    "MATOMO-DATABASE-PASSWORD"|"MYSQL-PASSWORD") env_value "MATOMO_DATABASE_PASSWORD" ;;
    "MATOMO-DATABASE-DBNAME"|"MYSQL-DATABASE") env_value "MATOMO_DATABASE_DBNAME" ;;
    "MYSQL-ROOT-PASSWORD") env_value "MYSQL_ROOT_PASSWORD" ;;
    "GF-SECURITY-ADMIN-USER") env_value "GF_SECURITY_ADMIN_USER" ;;
    "GF-SECURITY-ADMIN-PASSWORD") env_value "GF_SECURITY_ADMIN_PASSWORD" ;;
    "GF-SERVER-ROOT-URL") env_value "GF_SERVER_ROOT_URL" ;;
    "GF-SERVER-DOMAIN") env_value "GF_SERVER_DOMAIN" ;;
    "GF-AUTH-GENERIC-OAUTH-CLIENT-ID") env_value "GF_AUTH_GENERIC_OAUTH_CLIENT_ID" ;;
    "GF-AUTH-GENERIC-OAUTH-CLIENT-SECRET") env_value "GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET" ;;
    "TOOL0-DOMAIN") env_value "TOOL0_DOMAIN" ;;
    "TOOL0-API-TOOLBAR-APPLICATIONS") env_value "TOOL0_API_TOOLBAR_APPLICATIONS" ;;
    "TOOL0-FULL-URL") env_value "TOOL0_FULL_URL" ;;
    "TOOL1-MAPS-URL") env_value "TOOL1_MAPS_URL" ;;
    "TOOL2-EXPERIMENTS-URL") env_value "TOOL2_EXPERIMENTS_URL" ;;
    "TOOL2-IFRAME-URL") env_value "TOOL2_IFRAME_URL" ;;
    "HELP-URL") env_value "HELP_URL" ;;
    # Default values
    "CONTAINER-IMAGE-TOOL-TAG"|"CONTAINER_IMAGE_TOOL_TAG") env_value "CONTAINER_IMAGE_TOOL_TAG" ;;
    "DECIDIM-AVAILABLE-LOCALES") echo "en,it,fr,de,es" ;;
    "DECIDIM-DEFAULT-LOCALE") echo "en" ;;
    "DECIDIM-THROTTLING-MAX-REQUESTS") echo "100" ;;
    # k8s service defaults (aligned with generate-env-example.sh K8S_DEFAULTS)
    "DATABASE-HOST-DECIDIM") echo "db" ;;
    "ENABLE-JSON-LOGS") echo "true" ;;
    "GF-DATABASE-HOST") echo "grafana-db" ;;
    "GF-DATABASE-TYPE") echo "postgres" ;;
    "GRAFANA-PGDATA-PATH") echo "/var/lib/postgresql/data/pgdata" ;;
    "KEYCLOAK-DISABLE-SSL-VERIFY") echo "false" ;;
    "MAX-EVENT-LOOP-USE") echo "0.98" ;;
    "QUEUE-ADAPTER") echo "sidekiq" ;;
    "RATE-LIMIT-MAX") echo "100" ;;
    "RATE-LIMIT-TIME-WINDOW") echo "1 minute" ;;
    "REDIS-URL") echo "redis://redis:6379/0" ;;
    "RESTART-POLICY") echo "always" ;;
    # Grafana OAuth / misc
    "GF-DATABASE-NAME") echo "grafana" ;;
    "GF-DATABASE-USER") echo "grafana" ;;
    "GF-AUTH-GENERIC-OAUTH-ALLOW-SIGN-UP") echo "true" ;;
    "GF-AUTH-GENERIC-OAUTH-ALLOW-ASSIGN-GRAFANA-ADMIN") echo "true" ;;
    "GF-AUTH-GENERIC-OAUTH-API-URL") echo "" ;;
    "GF-AUTH-GENERIC-OAUTH-AUTH-URL") echo "" ;;
    "GF-AUTH-GENERIC-OAUTH-EMAIL-ATTRIBUTE-PATH") echo "email" ;;
    "GF-AUTH-GENERIC-OAUTH-GROUPS-ATTRIBUTE-PATH") echo "groups" ;;
    "GF-AUTH-GENERIC-OAUTH-LOGIN-ATTRIBUTE-PATH") echo "username" ;;
    "GF-AUTH-GENERIC-OAUTH-NAME") echo "Keycloak-OAuth" ;;
    "GF-AUTH-GENERIC-OAUTH-NAME-ATTRIBUTE-PATH") echo "full_name" ;;
    "GF-AUTH-GENERIC-OAUTH-SIGNOUT-REDIRECT-URL") echo "" ;;
    "GF-AUTH-GENERIC-OAUTH-TOKEN-URL") echo "" ;;
    # Misc app defaults
    "RAILS-LOG-LEVEL") echo "info" ;;
    "RAILS-ASSET-HOST") echo "" ;;
    "SMTP-TLS") echo "false" ;;
    "SMTP-OPEN-TIMEOUT") echo "10" ;;
    "SMTP-READ-TIMEOUT") echo "10" ;;
    "CHATBOT-SUPPORT-EMAIL") echo "support@example.com" ;;
    "CHATBOT-FROM-EMAIL") echo "noreply@example.com" ;;
    "DECIDIM-PRIMARY-COLOR") echo "#1976d2" ;;
    "DECIDIM-ORGANIZATION-NAME") echo "EU LDT Participate" ;;
    "DECIDIM-LOGO-URL") echo "" ;;
    "PRIVACY-POLICY-URL") echo "/privacy" ;;
    "NOTIFICATION-PREFERENCES-URL") echo "/notifications" ;;
    "JWT-ACCEPTED-ISSUERS"|"JWT-ACCEPTED-AUDIENCES") echo "decidim_app" ;;
    *) echo "" ;;  # Return empty for unknown vars
  esac
}

is_secret_manifest() {
  # true se il file contiene una risorsa K8s con kind: Secret (qualsiasi posizione, anche multi-doc)
  local path="$1"
  grep -Eq '^[[:space:]]*kind:[[:space:]]*Secret([[:space:]]|$)' "$path" 2>/dev/null
}

escape_perl_replacement() {
  perl -0777 -pe 's/\\/\\\\/g; s/\$/\\\$/g; s/@/\\@/g; s/\//\\\//g;'
}

b64_one_line() { base64 | tr -d '\n'; }

replace_placeholders() {
  local src_file="$1" dst_file="$2"
  mkdir -p "$(dirname "$dst_file")"
  cp -f "$src_file" "$dst_file"

  local vars secret_mode
  vars="$(collect_vars_in_file "$src_file")"
  secret_mode="false"
  if is_secret_manifest "$src_file"; then
    secret_mode="true"
  fi

  # Handle Docker images specially first - replace placeholders while keeping ACR prefix
  if grep -q "euldtshared\.azurecr\.io" "$dst_file"; then
    perl -pe 's|euldtshared\.azurecr\.io/eu-ldt-chatbot-be-int:_%CONTAINER_IMAGE_TOOL_TAG%_|euldtshared.azurecr.io/eu-ldt-chatbot-be-int:v1.0.0|g' -i "$dst_file"
    perl -pe 's|euldtshared\.azurecr\.io/eu-ldt-chatbot-fe-int:_%CONTAINER_IMAGE_TOOL_TAG%_|euldtshared.azurecr.io/eu-ldt-chatbot-fe-int:v1.0.0|g' -i "$dst_file"
    perl -pe 's|euldtshared\.azurecr\.io/eu-ldt-part-int:_%CONTAINER_IMAGE_TOOL_TAG%_|euldtshared.azurecr.io/eu-ldt-part-int:v1.0.0|g' -i "$dst_file"
    perl -pe 's|euldtshared\.azurecr\.io/matomo-custom:_%CONTAINER_IMAGE_TOOL_TAG%_|euldtshared.azurecr.io/matomo-custom:v1.0.0|g' -i "$dst_file"
    # Handle cases where the tag placeholder is missing (just ends with :)
    perl -pe 's|euldtshared\.azurecr\.io/eu-ldt-chatbot-be-int:$|euldtshared.azurecr.io/eu-ldt-chatbot-be-int:v1.0.0|g' -i "$dst_file"
    perl -pe 's|euldtshared\.azurecr\.io/eu-ldt-chatbot-fe-int:$|euldtshared.azurecr.io/eu-ldt-chatbot-fe-int:v1.0.0|g' -i "$dst_file"
    perl -pe 's|euldtshared\.azurecr\.io/eu-ldt-part-int:$|euldtshared.azurecr.io/eu-ldt-part-int:v1.0.0|g' -i "$dst_file"
    perl -pe 's|euldtshared\.azurecr\.io/matomo-custom:$|euldtshared.azurecr.io/matomo-custom:v1.0.0|g' -i "$dst_file"
  fi

  while IFS= read -r var; do
    [[ -z "$var" ]] && continue
    # Skip Docker image tag placeholder as it's already handled above
    [[ "$var" == "CONTAINER_IMAGE_TOOL_TAG" ]] && continue
    local val
    val="$(env_value "$var" || true)"

    if [[ -z "${val}" && "${ALLOW_UNSET}" != "true" ]]; then
      die "Missing value for '$var' (found in: $src_file). Provide it in $ENV_FILE or set ALLOW_UNSET=true."
    fi


    local val_escaped
    val_escaped="$(printf '%s' "$val" | escape_perl_replacement)"
    perl -0777 -pe "s/_%\\Q${var}\\E%_/${val_escaped}/g" -i "$dst_file"
  done <<< "$vars"
}

# --- Main -------------------------------------------------------------------
require_cmd perl
require_cmd awk
require_cmd grep
require_cmd sed
require_cmd mkdir
require_cmd cp
require_cmd find
require_cmd base64
require_cmd tr

[[ -d "$TEMPLATE_DIR" ]] || die "Template directory not found: $TEMPLATE_DIR"
[[ -f "$ENV_FILE" ]] || echo "NOTE: $ENV_FILE not found. Unset tokens will remain (set ALLOW_UNSET=false to fail)."

rm -rf "$OUT_DIR"
echo "🔧 Rendering Kubernetes configurations..."
echo "📁 From: '$TEMPLATE_DIR' → '$OUT_DIR'"

total_files=0
current_file=0

# Count total files for progress
total_files=$(find "$TEMPLATE_DIR" -type f \( -name "*.yml" -o -name "*.yaml" \) | wc -l)

while IFS= read -r -d '' f; do
  current_file=$((current_file + 1))
  rel="${f#$TEMPLATE_DIR/}"
  out="$OUT_DIR/$rel"
  echo "📝 Processing file $current_file/$total_files: $(basename "$f")"
  replace_placeholders "$f" "$out"
done < <(find "$TEMPLATE_DIR" -type f \( -name "*.yml" -o -name "*.yaml" \) -print0)

echo "✅ Successfully rendered $total_files Kubernetes manifests!"
echo "📁 Local configurations available in: $OUT_DIR"
echo ""
echo "🚀 Next steps:"
echo "   1. Review the generated configurations in $OUT_DIR"
echo "   2. Make sure your local Docker images are built with correct tags:"
echo "      docker build -t eu-ldt-chatbot-be:v1.0.0 ./backend"
echo "      docker build -t eu-ldt-chatbot-fe:v1.0.0 ./frontend"
echo "      docker build -t eu-ldt-part:v1.0.0 ./decidim"
echo "      docker build -t matomo-custom:v1.0.0 ./analytics/matomo"
echo "   3. Apply the configurations to your local Kubernetes cluster"
echo ""
echo "💡 Note: Secret values are automatically base64-encoded"

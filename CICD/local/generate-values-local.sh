#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
#
# Generate values-local.yaml from a .env file (no Python required).
# Usage: ./generate-values-local.sh --env-file .env --output values-local.yaml

set -euo pipefail

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------
ENV_FILE=""
OUTPUT_FILE=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --env-file) ENV_FILE="$2"; shift 2 ;;
        --output)   OUTPUT_FILE="$2"; shift 2 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done
[[ -n "${ENV_FILE}" && -f "${ENV_FILE}" ]] || { echo "ERROR: --env-file required and must exist" >&2; exit 1; }
[[ -n "${OUTPUT_FILE}" ]] || { echo "ERROR: --output required" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Undo bash printf %q escapes from the EU LDT toolbox installer (script.sh).
# Handles spaces (EU\ LDT), commas (en\,it\,es), quotes, $, etc. No eval.
# ---------------------------------------------------------------------------
normalize_bash_percent_q() {
    local v="${1:-}"
    [[ "$v" != *\\* ]] && { printf '%s' "$v"; return; }
    v="${v//\\,/,}"
    v="${v//\\ / }"
    v="${v//\\'/'}"
    v="${v//\\\"/\"}"
    v="${v//\\$/$}"
    v="${v//\\#/#}"
    v="${v//\\!/\!}"
    v="${v//\\\\/\\}"
    printf '%s' "$v"
}

# ---------------------------------------------------------------------------
# Read a value from the .env file by exact key name (all keys use underscores).
# Supports: KEY=value, KEY="quoted", KEY='quoted', KEY=bash\ %q\ escapes.
# ---------------------------------------------------------------------------
ev() {
    local key="$1"
    local raw
    raw="$(grep -E "^[[:space:]]*(export[[:space:]]+)?${key}[[:space:]]*=" "${ENV_FILE}" 2>/dev/null \
        | tail -1 \
        | sed -E 's/^[[:space:]]*(export[[:space:]]+)?[^=]+=//')"
    # Strip trailing inline comment only when preceded by at least one space
    # (avoids stripping '#' that is part of the value, e.g. hex colours #0076d0)
    raw="$(printf '%s' "${raw}" | sed -E 's/[[:space:]]+#[^"'"'"']*$//')"
    # Strip surrounding double or single quotes
    raw="$(printf '%s' "${raw}" | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/')"
    # Unescape inner \" and \\ from quoted .env lines
    raw="${raw//\\\"/\"}"
    raw="${raw//\\\\/\\}"
    raw="$(normalize_bash_percent_q "$raw")"
    printf '%s' "${raw}"
}

# ---------------------------------------------------------------------------
# Emit a single YAML key: "value" line — skipped when value is empty.
# ---------------------------------------------------------------------------
yq_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

line() {
    local indent_key="$1" val="$2"
    [[ -n "${val}" ]] && printf '%s: "%s"\n' "${indent_key}" "$(yq_escape "${val}")" || true
}

# Emit a YAML boolean key — skipped when value is empty.
bool_line() {
    local indent_key="$1" val="$2"
    [[ -z "${val}" ]] && return 0
    [[ "$(printf '%s' "${val}" | tr '[:upper:]' '[:lower:]')" == "true" ]] && printf '%s: true\n' "${indent_key}" || printf '%s: false\n' "${indent_key}"
}

# Build postgres:// DSN from components.
build_postgres_url() {
    local user="$1" pass="$2" host="$3" dbname="$4"
    printf 'postgres://%s:%s@%s:5432/%s' "${user}" "${pass}" "${host}" "${dbname}"
}

# ---------------------------------------------------------------------------
# ACR dockerconfigjson builder (pure bash + base64)
# ---------------------------------------------------------------------------
build_acr_dockerconfig() {
    local registry="$1" username="$2" password="$3"
    local auth
    auth="$(printf '%s:%s' "${username}" "${password}" | base64 | tr -d '\n')"
    local json_inner
    json_inner="$(printf '{"username":"%s","password":"%s","auth":"%s"}' \
        "${username}" "${password}" "${auth}")"
    printf '%s' "{\"auths\":{\"${registry}\":${json_inner}}}" \
        | base64 | tr -d '\n'
}

# ---------------------------------------------------------------------------
# Collect values from .env
# ---------------------------------------------------------------------------

# --- image / cluster ---
_tag="$(ev CONTAINER_IMAGE_TOOL_TAG)"
_registry="$(ev REGISTRY)"
_pull_policy="$(ev IMAGE_PULL_POLICY)"
[[ -z "${_pull_policy}" ]] && _pull_policy="IfNotPresent"
_namespace="$(ev NAMESPACE)"
_repo_decidim="$(ev REPO_DECIDIM)"
[[ -z "${_repo_decidim}" ]] && _repo_decidim="eu-ldt-part-int"
_repo_chatbot_be="$(ev REPO_CHATBOT_BE)"
[[ -z "${_repo_chatbot_be}" ]] && _repo_chatbot_be="eu-ldt-chatbot-be-int"
_repo_chatbot_fe="$(ev REPO_CHATBOT_FE)"
[[ -z "${_repo_chatbot_fe}" ]] && _repo_chatbot_fe="eu-ldt-chatbot-fe-int"
_repo_matomo="$(ev REPO_MATOMO)"
[[ -z "${_repo_matomo}" ]] && _repo_matomo="matomo-custom"

# --- ingress ---
_participate_host="$(ev PARTICIPATE_HOST)"

# --- decidim ---
_decidim_host="$(ev DECIDIM_HOST)"
_decidim_force_ssl="$(ev DECIDIM_FORCE_SSL)"
_decidim_protocol="$(ev DECIDIM_PROTOCOL)"
_decidim_jitsi_url="$(ev DECIDIM_JITSI_URL)"
_decidim_mailer_sender="$(ev DECIDIM_MAILER_SENDER)"
_decidim_avail_locales="$(ev DECIDIM_AVAILABLE_LOCALES)"
_decidim_default_locale="$(ev DECIDIM_DEFAULT_LOCALE)"
_decidim_throttling="$(ev DECIDIM_THROTTLING_MAX_REQUESTS)"
_decidim_db_host="$(ev DATABASE_HOST_DECIDIM)"
_decidim_db_name="$(ev DATABASE_NAME_DECIDIM)"
_decidim_db_user="$(ev DATABASE_USERNAME_DECIDIM)"
_decidim_db_pass="$(ev DATABASE_PASSWORD_DECIDIM)"
_decidim_db_url="$(ev DATABASE_URL_DECIDIM)"
_decidim_secret_key="$(ev SECRET_KEY_BASE)"
_keycloak_client_id="$(ev OMNIAUTH_KEYCLOAK_CLIENT_ID)"
_keycloak_client_secret="$(ev OMNIAUTH_KEYCLOAK_CLIENT_SECRET)"
_keycloak_realm="$(ev OMNIAUTH_KEYCLOAK_REALM)"
_keycloak_site="$(ev OMNIAUTH_KEYCLOAK_SITE)"
_keycloak_disable_ssl="$(ev KEYCLOAK_DISABLE_SSL_VERIFY)"
_redis_url="$(ev REDIS_URL)"
_queue_adapter="$(ev QUEUE_ADAPTER)"
_enable_json_logs="$(ev ENABLE_JSON_LOGS)"
_rails_log_level="$(ev RAILS_LOG_LEVEL)"
_rails_asset_host="$(ev RAILS_ASSET_HOST)"
_restart_policy="$(ev RESTART_POLICY)"
_help_url="$(ev HELP_URL)"
_meetings_embeddable="$(ev MEETINGS_EMBEDDABLE_SERVICES)"
_pv_embed_base_url="$(ev PV_EMBED_BASE_URL)"
_decidim_primary_color="$(ev DECIDIM_PRIMARY_COLOR)"
_decidim_org_name="$(ev DECIDIM_ORGANIZATION_NAME)"
_decidim_logo_url="$(ev DECIDIM_LOGO_URL)"
_privacy_policy_url="$(ev PRIVACY_POLICY_URL)"
_notif_prefs_url="$(ev NOTIFICATION_PREFERENCES_URL)"

# --- chatbot ---
_cors_origins="$(ev CORS_ORIGINS)"
_rate_limit_max="$(ev RATE_LIMIT_MAX)"
_rate_limit_window="$(ev RATE_LIMIT_TIME_WINDOW)"
_max_event_loop="$(ev MAX_EVENT_LOOP_USE)"
_chatbot_support_email="$(ev CHATBOT_SUPPORT_EMAIL)"
_chatbot_from_email="$(ev CHATBOT_FROM_EMAIL)"
_cypher_secret="$(ev CYPHER_SECRET)"
_cypher_salt="$(ev CYPHER_SALT)"
_chatbot_backend_url="$(ev CHATBOT_BACKEND_URL)"
_chatbot_url="$(ev CHATBOT_URL)"
_vite_api_url="$(ev VITE_API_URL)"
_chatbot_db_name="$(ev DB_NAME_CHATBOT)"
_chatbot_db_user="$(ev DB_USERNAME_CHATBOT)"
_chatbot_db_pass="$(ev DB_PASSWORD_CHATBOT)"
_chatbot_db_url="$(ev DATABASE_URL_CHATBOT)"

# --- smtp ---
_smtp_address="$(ev SMTP_ADDRESS)"
_smtp_port="$(ev SMTP_PORT)"
_smtp_domain="$(ev SMTP_DOMAIN)"
_smtp_auth="$(ev SMTP_AUTHENTICATION)"
_smtp_starttls="$(ev SMTP_ENABLE_STARTTLS_AUTO)"
_smtp_tls="$(ev SMTP_TLS)"
_smtp_open_timeout="$(ev SMTP_OPEN_TIMEOUT)"
_smtp_read_timeout="$(ev SMTP_READ_TIMEOUT)"
_smtp_username="$(ev SMTP_USERNAME)"
_smtp_user_name="$(ev SMTP_USER_NAME)"
_smtp_password="$(ev SMTP_PASSWORD)"

# --- externalTools ---
_tool0_domain="$(ev TOOL0_DOMAIN)"
_tool0_full_url="$(ev TOOL0_FULL_URL)"
_tool0_api_apps="$(ev TOOL0_API_TOOLBAR_APPLICATIONS)"
_tool1_maps_url="$(ev TOOL1_MAPS_URL)"
_tool2_exp_url="$(ev TOOL2_EXPERIMENTS_URL)"
_tool2_iframe_url="$(ev TOOL2_IFRAME_URL)"

# --- grafana ---
_gf_server_domain="$(ev GF_SERVER_DOMAIN)"
_gf_server_root_url="$(ev GF_SERVER_ROOT_URL)"
_gf_serve_sub_path="$(ev GF_SERVER_SERVE_FROM_SUB_PATH)"
_gf_db_type="$(ev GF_DATABASE_TYPE)"
_gf_db_host="$(ev GF_DATABASE_HOST)"
_gf_db_name="$(ev GF_DATABASE_NAME)"
_gf_db_user="$(ev GF_DATABASE_USER)"
_gf_db_pass="$(ev GF_DATABASE_PASSWORD)"
_gf_pgdata_path="$(ev GRAFANA_PGDATA_PATH)"
_gf_admin_user="$(ev GF_SECURITY_ADMIN_USER)"
_gf_admin_pass="$(ev GF_SECURITY_ADMIN_PASSWORD)"
_gf_oauth_allow_signup="$(ev GF_AUTH_GENERIC_OAUTH_ALLOW_SIGN_UP)"
_gf_oauth_allow_admin="$(ev GF_AUTH_GENERIC_OAUTH_ALLOW_ASSIGN_GRAFANA_ADMIN)"
_gf_oauth_api_url="$(ev GF_AUTH_GENERIC_OAUTH_API_URL)"
_gf_oauth_auth_url="$(ev GF_AUTH_GENERIC_OAUTH_AUTH_URL)"
_gf_oauth_client_id="$(ev GF_AUTH_GENERIC_OAUTH_CLIENT_ID)"
_gf_oauth_client_secret="$(ev GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET)"
_gf_oauth_email_path="$(ev GF_AUTH_GENERIC_OAUTH_EMAIL_ATTRIBUTE_PATH)"
_gf_oauth_groups_path="$(ev GF_AUTH_GENERIC_OAUTH_GROUPS_ATTRIBUTE_PATH)"
_gf_oauth_login_path="$(ev GF_AUTH_GENERIC_OAUTH_LOGIN_ATTRIBUTE_PATH)"
_gf_oauth_name="$(ev GF_AUTH_GENERIC_OAUTH_NAME)"
_gf_oauth_name_path="$(ev GF_AUTH_GENERIC_OAUTH_NAME_ATTRIBUTE_PATH)"
_gf_oauth_role_path="$(ev GF_AUTH_GENERIC_OAUTH_ROLE_ATTRIBUTE_PATH)"
_gf_oauth_scopes="$(ev GF_AUTH_GENERIC_OAUTH_SCOPES)"
_gf_oauth_signout_url="$(ev GF_AUTH_GENERIC_OAUTH_SIGNOUT_REDIRECT_URL)"
_gf_oauth_token_url="$(ev GF_AUTH_GENERIC_OAUTH_TOKEN_URL)"

# --- matomo ---
_matomo_site_id="$(ev MATOMO_SITE_ID)"
_matomo_server_address="$(ev MATOMO_SERVER_ADDRESS)"
_matomo_token_auth="$(ev MATOMO_TOKEN_AUTH)"
_matomo_root_url="$(ev MATOMO_ROOT_URL)"
_matomo_trusted_host="$(ev MATOMO_TRUSTED_HOST)"
_matomo_db_host="$(ev MATOMO_DATABASE_HOST)"
_matomo_db_name="$(ev MATOMO_DATABASE_DBNAME)"; [[ -z "${_matomo_db_name}" ]] && _matomo_db_name="$(ev MYSQL_DATABASE)"
_matomo_db_user="$(ev MATOMO_DATABASE_USERNAME)"; [[ -z "${_matomo_db_user}" ]] && _matomo_db_user="$(ev MYSQL_USER)"
_matomo_db_pass="$(ev MATOMO_DATABASE_PASSWORD)"; [[ -z "${_matomo_db_pass}" ]] && _matomo_db_pass="$(ev MYSQL_PASSWORD)"
_matomo_db_root_pass="$(ev MYSQL_ROOT_PASSWORD)"

# --- jitsi ---
_jitsi_enabled="$(ev JITSI_ENABLED)"
_jitsi_host="$(ev JITSI_HOST)"
_jitsi_public_url="$(ev PUBLIC_URL)"
_jitsi_jwt_app_id="$(ev JWT_APP_ID)"
_jitsi_jwt_issuers="$(ev JWT_ACCEPTED_ISSUERS)"
_jitsi_jwt_audiences="$(ev JWT_ACCEPTED_AUDIENCES)"
_jitsi_jvb_stun="$(ev JVB_STUN_SERVERS)"
_jitsi_jicofo_pass="$(ev JICOFO_AUTH_PASSWORD)"
_jitsi_jvb_pass="$(ev JVB_AUTH_PASSWORD)"
_jitsi_jwt_secret="$(ev JWT_APP_SECRET)"

# --- ACR pull secret ---
_acr_enabled="$(ev ACR_ENABLED)"
_acr_registry="$(ev REGISTRY)"
_acr_user="$(ev ACR_USERNAME)"
_acr_pass="$(ev ACR_PASSWORD)"

# ---------------------------------------------------------------------------
# Local Kind defaults (fill gaps / fix placeholder DSNs from incomplete .env)
# ---------------------------------------------------------------------------
_postgres_db_default="$(ev POSTGRES_DATABASE)"
[[ -z "${_postgres_db_default}" ]] && _postgres_db_default="decidim_production"

[[ -z "${_decidim_db_host}" ]] && _decidim_db_host="db"
[[ -z "${_decidim_db_name}" ]] && _decidim_db_name="${_postgres_db_default}"
[[ -z "${_decidim_db_user}" ]] && _decidim_db_user="postgres"
[[ -z "${_decidim_db_pass}" ]] && _decidim_db_pass="postgres"
if [[ -z "${_decidim_db_url}" ]] || [[ "${_decidim_db_url}" == *"@host:"* ]] || [[ "${_decidim_db_url}" == *"@host/"* ]]; then
    _decidim_db_url="$(build_postgres_url "${_decidim_db_user}" "${_decidim_db_pass}" "${_decidim_db_host}" "${_decidim_db_name}")"
fi

[[ -z "${_chatbot_db_name}" ]] && _chatbot_db_name="postgres"
[[ -z "${_chatbot_db_user}" ]] && _chatbot_db_user="postgres"
[[ -z "${_chatbot_db_pass}" ]] && _chatbot_db_pass="postgres"
if [[ -z "${_chatbot_db_url}" ]] || [[ "${_chatbot_db_url}" == *"@host:"* ]] || [[ "${_chatbot_db_url}" == *"@host/"* ]]; then
    _chatbot_db_url="$(build_postgres_url "${_chatbot_db_user}" "${_chatbot_db_pass}" "db" "${_chatbot_db_name}")"
fi

[[ -z "${_jitsi_jvb_pass}" ]] && _jitsi_jvb_pass="localdev-jvb-pass"
[[ -z "${_jitsi_jicofo_pass}" ]] && _jitsi_jicofo_pass="${_jitsi_jvb_pass}"
[[ -z "${_jitsi_jwt_secret}" ]] && _jitsi_jwt_secret="localdev-jwt-secret"

[[ -z "${_decidim_force_ssl}" ]] && _decidim_force_ssl="false"
[[ -z "${_decidim_protocol}" ]] && _decidim_protocol="http"
case "$(printf '%s' "${_decidim_force_ssl}" | tr '[:upper:]' '[:lower:]')" in
    true|1|yes) _decidim_force_ssl="true" ;;
    *)          _decidim_force_ssl="false" ;;
esac
case "$(printf '%s' "${_decidim_protocol}" | tr '[:upper:]' '[:lower:]')" in
    https) _decidim_protocol="https" ;;
    *)     _decidim_protocol="http" ;;
esac

# ---------------------------------------------------------------------------
# Write values-local.yaml
# ---------------------------------------------------------------------------
{
cat <<'HEADER'
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Auto-generated by generate-values-local.sh — DO NOT COMMIT
HEADER

line "namespace" "${_namespace}"

echo "image:"
line "  tag"        "${_tag}"
line "  registry"   "${_acr_registry}"
line "  pullPolicy" "${_pull_policy}"
echo "  repositories:"
line "    decidim"   "${_repo_decidim}"
line "    chatbotBe" "${_repo_chatbot_be}"
line "    chatbotFe" "${_repo_chatbot_fe}"
line "    matomo"    "${_repo_matomo}"

# ACR pull secret (only when ACR_ENABLED=true and credentials are set)
if [[ "$(printf '%s' "${_acr_enabled}" | tr '[:upper:]' '[:lower:]')" == "true" && -n "${_acr_registry}" && -n "${_acr_user}" && -n "${_acr_pass}" ]]; then
    echo "acr:"
    echo "  enabled: true"
    printf '  dockerconfigjson: "%s"\n' "$(build_acr_dockerconfig "${_acr_registry}" "${_acr_user}" "${_acr_pass}")"
fi

echo "ingress:"
line "  participateHost" "${_participate_host}"

echo "decidim:"
line "  host"                       "${_decidim_host}"
line "  forceSsl"                   "${_decidim_force_ssl}"
line "  protocol"                   "${_decidim_protocol}"
line "  jitsiUrl"                   "${_decidim_jitsi_url}"
line "  mailerSender"               "${_decidim_mailer_sender}"
line "  availableLocales"           "${_decidim_avail_locales}"
line "  defaultLocale"              "${_decidim_default_locale}"
line "  throttlingMaxRequests"      "${_decidim_throttling}"
line "  secretKeyBase"              "${_decidim_secret_key}"
line "  redisUrl"                   "${_redis_url}"
line "  queueAdapter"               "${_queue_adapter}"
line "  enableJsonLogs"             "${_enable_json_logs}"
line "  railsLogLevel"              "${_rails_log_level}"
line "  railsAssetHost"             "${_rails_asset_host}"
line "  restartPolicy"              "${_restart_policy}"
line "  helpUrl"                    "${_help_url}"
line "  meetingsEmbeddableServices" "${_meetings_embeddable}"
line "  pvEmbedBaseUrl"             "${_pv_embed_base_url}"
line "  primaryColor"               "${_decidim_primary_color}"
line "  organizationName"           "${_decidim_org_name}"
line "  logoUrl"                    "${_decidim_logo_url}"
line "  privacyPolicyUrl"           "${_privacy_policy_url}"
line "  notificationPreferencesUrl" "${_notif_prefs_url}"
echo "  db:"
line "    host"     "${_decidim_db_host}"
line "    name"     "${_decidim_db_name}"
line "    username" "${_decidim_db_user}"
line "    password" "${_decidim_db_pass}"
line "    url"      "${_decidim_db_url}"
echo "  keycloak:"
line "    clientId"         "${_keycloak_client_id}"
line "    clientSecret"     "${_keycloak_client_secret}"
line "    realm"            "${_keycloak_realm}"
line "    site"             "${_keycloak_site}"
line "    disableSslVerify" "${_keycloak_disable_ssl}"

echo "chatbot:"
echo "  backend:"
line "    corsOrigins"         "${_cors_origins}"
line "    rateLimitMax"        "${_rate_limit_max}"
line "    rateLimitTimeWindow" "${_rate_limit_window}"
line "    maxEventLoopUse"     "${_max_event_loop}"
line "    supportEmail"        "${_chatbot_support_email}"
line "    fromEmail"           "${_chatbot_from_email}"
line "    cypherSecret"        "${_cypher_secret}"
line "    cypherSalt"          "${_cypher_salt}"
line "    url"                 "${_chatbot_backend_url}"
echo "  frontend:"
line "    url"    "${_chatbot_url}"
line "    apiUrl" "${_vite_api_url}"
echo "  db:"
line "    name"     "${_chatbot_db_name}"
line "    username" "${_chatbot_db_user}"
line "    password" "${_chatbot_db_pass}"
line "    url"      "${_chatbot_db_url}"

echo "smtp:"
line "  address"            "${_smtp_address}"
line "  port"               "${_smtp_port}"
line "  domain"             "${_smtp_domain}"
line "  authentication"     "${_smtp_auth}"
line "  enableStarttlsAuto" "${_smtp_starttls}"
line "  tls"                "${_smtp_tls}"
line "  openTimeout"        "${_smtp_open_timeout}"
line "  readTimeout"        "${_smtp_read_timeout}"
line "  username"           "${_smtp_username}"
line "  userName"           "${_smtp_user_name}"
line "  password"           "${_smtp_password}"

echo "externalTools:"
echo "  tool0:"
line "    domain"                 "${_tool0_domain}"
line "    fullUrl"                "${_tool0_full_url}"
line "    apiToolbarApplications" "${_tool0_api_apps}"
echo "  tool1:"
line "    mapsUrl" "${_tool1_maps_url}"
echo "  tool2:"
line "    experimentsUrl" "${_tool2_exp_url}"
line "    iframeUrl"      "${_tool2_iframe_url}"

echo "grafana:"
line "  serverDomain"     "${_gf_server_domain}"
line "  serverRootUrl"    "${_gf_server_root_url}"
line "  serveFromSubPath" "${_gf_serve_sub_path}"
echo "  db:"
line "    type"       "${_gf_db_type}"
line "    host"       "${_gf_db_host}"
line "    name"       "${_gf_db_name}"
line "    user"       "${_gf_db_user}"
line "    password"   "${_gf_db_pass}"
line "    pgdataPath" "${_gf_pgdata_path}"
echo "  admin:"
line "    user"     "${_gf_admin_user}"
line "    password" "${_gf_admin_pass}"
echo "  oauth:"
line "    allowSignUp"             "${_gf_oauth_allow_signup}"
line "    allowAssignGrafanaAdmin" "${_gf_oauth_allow_admin}"
line "    apiUrl"                  "${_gf_oauth_api_url}"
line "    authUrl"                 "${_gf_oauth_auth_url}"
line "    clientId"                "${_gf_oauth_client_id}"
line "    clientSecret"            "${_gf_oauth_client_secret}"
line "    emailAttributePath"      "${_gf_oauth_email_path}"
line "    groupsAttributePath"     "${_gf_oauth_groups_path}"
line "    loginAttributePath"      "${_gf_oauth_login_path}"
line "    name"                    "${_gf_oauth_name}"
line "    nameAttributePath"       "${_gf_oauth_name_path}"
line "    roleAttributePath"       "${_gf_oauth_role_path}"
line "    scopes"                  "${_gf_oauth_scopes}"
line "    signoutRedirectUrl"      "${_gf_oauth_signout_url}"
line "    tokenUrl"                "${_gf_oauth_token_url}"

echo "matomo:"
line "  siteId"        "${_matomo_site_id}"
line "  serverAddress" "${_matomo_server_address}"
line "  tokenAuth"     "${_matomo_token_auth}"
line "  rootUrl"       "${_matomo_root_url}"
line "  trustedHost"   "${_matomo_trusted_host}"
echo "  db:"
line "    host"         "${_matomo_db_host}"
line "    name"         "${_matomo_db_name}"
line "    username"     "${_matomo_db_user}"
line "    password"     "${_matomo_db_pass}"
line "    rootPassword" "${_matomo_db_root_pass}"

echo "jitsi:"
bool_line "  enabled"              "${_jitsi_enabled}"
line "  host"                "${_jitsi_host}"
line "  publicUrl"           "${_jitsi_public_url}"
line "  jwtAppId"            "${_jitsi_jwt_app_id}"
line "  jwtAcceptedIssuers"  "${_jitsi_jwt_issuers}"
line "  jwtAcceptedAudiences" "${_jitsi_jwt_audiences}"
line "  jvbStunServers"      "${_jitsi_jvb_stun}"
line "  jicofoAuthPassword"  "${_jitsi_jicofo_pass}"
line "  jvbAuthPassword"     "${_jitsi_jvb_pass}"
line "  jwtAppSecret"        "${_jitsi_jwt_secret}"

} > "${OUTPUT_FILE}"

_count=$(grep -cE '^[[:space:]]+[a-zA-Z]' "${OUTPUT_FILE}" 2>/dev/null || true)
echo "✅ Generated ${OUTPUT_FILE} with ${_count} values"

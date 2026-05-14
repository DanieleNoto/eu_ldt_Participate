#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors: Gianfranco Cedro
#
# Converts .env file to values-local.yaml for Helm deployment.
# Usage: python3 generate-values-local.py --env-file .env --output values-local.yaml

import argparse
import sys
import re

# Complete env var → Helm values key mapping
ENV_TO_VALUES = {
    # Image
    "CONTAINER_IMAGE_TOOL_TAG": "image.tag",

    # Ingress
    "PARTICIPATE-HOST": "ingress.participateHost",

    # Decidim
    "DECIDIM-HOST": "decidim.host",
    "DECIDIM-JITSI-URL": "decidim.jitsiUrl",
    "DECIDIM-MAILER-SENDER": "decidim.mailerSender",
    "DECIDIM-AVAILABLE-LOCALES": "decidim.availableLocales",
    "DECIDIM-DEFAULT-LOCALE": "decidim.defaultLocale",
    "DECIDIM-THROTTLING-MAX-REQUESTS": "decidim.throttlingMaxRequests",
    "DATABASE-HOST-DECIDIM": "decidim.db.host",
    "DATABASE-NAME-DECIDIM": "decidim.db.name",
    "DATABASE-USERNAME-DECIDIM": "decidim.db.username",
    "DATABASE-PASSWORD-DECIDIM": "decidim.db.password",
    "DATABASE-URL-DECIDIM": "decidim.db.url",
    "SECRET-KEY-BASE": "decidim.secretKeyBase",
    "OMNIAUTH-KEYCLOAK-CLIENT-ID": "decidim.keycloak.clientId",
    "OMNIAUTH-KEYCLOAK-CLIENT-SECRET": "decidim.keycloak.clientSecret",
    "OMNIAUTH-KEYCLOAK-REALM": "decidim.keycloak.realm",
    "OMNIAUTH-KEYCLOAK-SITE": "decidim.keycloak.site",
    "KEYCLOAK-DISABLE-SSL-VERIFY": "decidim.keycloak.disableSslVerify",
    "REDIS-URL": "decidim.redisUrl",
    "QUEUE-ADAPTER": "decidim.queueAdapter",
    "ENABLE-JSON-LOGS": "decidim.enableJsonLogs",
    "RAILS-LOG-LEVEL": "decidim.railsLogLevel",
    "RAILS-ASSET-HOST": "decidim.railsAssetHost",
    "RESTART-POLICY": "decidim.restartPolicy",
    "HELP-URL": "decidim.helpUrl",
    "MEETINGS-EMBEDDABLE-SERVICES": "decidim.meetingsEmbeddableServices",
    "PV-EMBED-BASE-URL": "decidim.pvEmbedBaseUrl",
    "DECIDIM-PRIMARY-COLOR": "decidim.primaryColor",
    "DECIDIM-ORGANIZATION-NAME": "decidim.organizationName",
    "DECIDIM-LOGO-URL": "decidim.logoUrl",
    "PRIVACY-POLICY-URL": "decidim.privacyPolicyUrl",
    "NOTIFICATION-PREFERENCES-URL": "decidim.notificationPreferencesUrl",

    # Chatbot
    "CORS-ORIGINS": "chatbot.backend.corsOrigins",
    "RATE-LIMIT-MAX": "chatbot.backend.rateLimitMax",
    "RATE-LIMIT-TIME-WINDOW": "chatbot.backend.rateLimitTimeWindow",
    "MAX-EVENT-LOOP-USE": "chatbot.backend.maxEventLoopUse",
    "CHATBOT-SUPPORT-EMAIL": "chatbot.backend.supportEmail",
    "CHATBOT-FROM-EMAIL": "chatbot.backend.fromEmail",
    "CYPHER-SECRET": "chatbot.backend.cypherSecret",
    "CYPHER-SALT": "chatbot.backend.cypherSalt",
    "CHATBOT-BACKEND-URL": "chatbot.backend.url",
    "CHATBOT-URL": "chatbot.frontend.url",
    "VITE-API-URL": "chatbot.frontend.apiUrl",
    "DB-NAME-CHATBOT": "chatbot.db.name",
    "DB-USERNAME-CHATBOT": "chatbot.db.username",
    "DB-PASSWORD-CHATBOT": "chatbot.db.password",
    "DATABASE-URL-CHATBOT": "chatbot.db.url",

    # SMTP
    "SMTP-ADDRESS": "smtp.address",
    "SMTP-PORT": "smtp.port",
    "SMTP-DOMAIN": "smtp.domain",
    "SMTP-AUTHENTICATION": "smtp.authentication",
    "SMTP-ENABLE-STARTTLS-AUTO": "smtp.enableStarttlsAuto",
    "SMTP-TLS": "smtp.tls",
    "SMTP-OPEN-TIMEOUT": "smtp.openTimeout",
    "SMTP-READ-TIMEOUT": "smtp.readTimeout",
    "SMTP-USERNAME": "smtp.username",
    "SMTP-USER-NAME": "smtp.userName",
    "SMTP-PASSWORD": "smtp.password",

    # External Tools
    "TOOL0-DOMAIN": "externalTools.tool0.domain",
    "TOOL0-FULL-URL": "externalTools.tool0.fullUrl",
    "TOOL0-API-TOOLBAR-APPLICATIONS": "externalTools.tool0.apiToolbarApplications",
    "TOOL1-MAPS-URL": "externalTools.tool1.mapsUrl",
    "TOOL2-EXPERIMENTS-URL": "externalTools.tool2.experimentsUrl",
    "TOOL2-IFRAME-URL": "externalTools.tool2.iframeUrl",

    # Grafana
    "GF-SERVER-DOMAIN": "grafana.serverDomain",
    "GF-SERVER-ROOT-URL": "grafana.serverRootUrl",
    "GF-SERVER-SERVE-FROM-SUB-PATH": "grafana.serveFromSubPath",
    "GF-DATABASE-TYPE": "grafana.db.type",
    "GF-DATABASE-HOST": "grafana.db.host",
    "GF-DATABASE-NAME": "grafana.db.name",
    "GF-DATABASE-USER": "grafana.db.user",
    "GF-DATABASE-PASSWORD": "grafana.db.password",
    "GRAFANA-PGDATA-PATH": "grafana.db.pgdataPath",
    "GF-SECURITY-ADMIN-USER": "grafana.admin.user",
    "GF-SECURITY-ADMIN-PASSWORD": "grafana.admin.password",
    "GF-AUTH-GENERIC-OAUTH-ALLOW-SIGN-UP": "grafana.oauth.allowSignUp",
    "GF-AUTH-GENERIC-OAUTH-ALLOW-ASSIGN-GRAFANA-ADMIN": "grafana.oauth.allowAssignGrafanaAdmin",
    "GF-AUTH-GENERIC-OAUTH-API-URL": "grafana.oauth.apiUrl",
    "GF-AUTH-GENERIC-OAUTH-AUTH-URL": "grafana.oauth.authUrl",
    "GF-AUTH-GENERIC-OAUTH-CLIENT-ID": "grafana.oauth.clientId",
    "GF-AUTH-GENERIC-OAUTH-CLIENT-SECRET": "grafana.oauth.clientSecret",
    "GF-AUTH-GENERIC-OAUTH-EMAIL-ATTRIBUTE-PATH": "grafana.oauth.emailAttributePath",
    "GF-AUTH-GENERIC-OAUTH-GROUPS-ATTRIBUTE-PATH": "grafana.oauth.groupsAttributePath",
    "GF-AUTH-GENERIC-OAUTH-LOGIN-ATTRIBUTE-PATH": "grafana.oauth.loginAttributePath",
    "GF-AUTH-GENERIC-OAUTH-NAME": "grafana.oauth.name",
    "GF-AUTH-GENERIC-OAUTH-NAME-ATTRIBUTE-PATH": "grafana.oauth.nameAttributePath",
    "GF-AUTH-GENERIC-OAUTH-ROLE-ATTRIBUTE-PATH": "grafana.oauth.roleAttributePath",
    "GF-AUTH-GENERIC-OAUTH-SCOPES": "grafana.oauth.scopes",
    "GF-AUTH-GENERIC-OAUTH-SIGNOUT-REDIRECT-URL": "grafana.oauth.signoutRedirectUrl",
    "GF-AUTH-GENERIC-OAUTH-TOKEN-URL": "grafana.oauth.tokenUrl",

    # Matomo
    "MATOMO-SITE-ID": "matomo.siteId",
    "MATOMO-SERVER-ADDRESS": "matomo.serverAddress",
    "MATOMO-TOKEN-AUTH": "matomo.tokenAuth",
    "MATOMO-ROOT-URL": "matomo.rootUrl",
    "MATOMO-TRUSTED-HOST": "matomo.trustedHost",
    "MATOMO-DATABASE-HOST": "matomo.db.host",
    "MATOMO-DATABASE-DBNAME": "matomo.db.name",
    "MATOMO-DATABASE-USERNAME": "matomo.db.username",
    "MATOMO-DATABASE-PASSWORD": "matomo.db.password",
    "MYSQL-DATABASE": "matomo.db.name",
    "MYSQL-USER": "matomo.db.username",
    "MYSQL-PASSWORD": "matomo.db.password",
    "MYSQL-ROOT-PASSWORD": "matomo.db.rootPassword",

    # Jitsi
    "JITSI-HOST": "jitsi.host",
    "PUBLIC-URL": "jitsi.publicUrl",
    "JWT-APP-ID": "jitsi.jwtAppId",
    "JWT-ACCEPTED-ISSUERS": "jitsi.jwtAcceptedIssuers",
    "JWT-ACCEPTED-AUDIENCES": "jitsi.jwtAcceptedAudiences",
    "JVB-STUN-SERVERS": "jitsi.jvbStunServers",
    "JICOFO-AUTH-PASSWORD": "jitsi.jicofoAuthPassword",
    "JVB-AUTH-PASSWORD": "jitsi.jvbAuthPassword",
    "JWT-APP-SECRET": "jitsi.jwtAppSecret",
}


def parse_env_file(env_path):
    """Parse .env file, return dict of key → value. Skip comments and blank lines."""
    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            # Skip blank lines and comments
            if not line or line.startswith('#'):
                continue
            # Strip inline comments
            if '#' in line:
                line = line.split('#', 1)[0].strip()
            # Handle export KEY=VALUE or KEY=VALUE
            if line.startswith('export '):
                line = line[7:].strip()
            # Split on first =
            if '=' not in line:
                continue
            key, val = line.split('=', 1)
            key = key.strip()
            val = val.strip()
            # Remove surrounding quotes if present
            if val.startswith('"') and val.endswith('"'):
                val = val[1:-1]
            elif val.startswith("'") and val.endswith("'"):
                val = val[1:-1]
            env_vars[key] = val
    return env_vars


def build_nested_dict(flat_dict):
    """Convert flat dict with dot-notation keys to nested dict."""
    result = {}
    for key_path, value in flat_dict.items():
        parts = key_path.split('.')
        current = result
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = value
    return result


def dict_to_yaml(data, indent=0):
    """Simple YAML emitter for nested dicts. Handles strings, ints, floats, bools."""
    lines = []
    prefix = '  ' * indent
    for key, value in sorted(data.items()):
        if isinstance(value, dict):
            lines.append(f"{prefix}{key}:")
            lines.append(dict_to_yaml(value, indent + 1))
        else:
            # Type conversion
            if isinstance(value, bool):
                val_str = 'true' if value else 'false'
            elif isinstance(value, (int, float)):
                val_str = str(value)
            else:
                # String - quote if contains special chars
                val_str = str(value)
                if any(c in val_str for c in [':', '#', '@', '&', '*', '!', '|', '>', '<', '%', '{', '}', '[', ']', ',', '?', '-']) or val_str.startswith(' ') or val_str.endswith(' '):
                    val_str = f'"{val_str}"'
            lines.append(f"{prefix}{key}: {val_str}")
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Generate values-local.yaml from .env file')
    parser.add_argument('--env-file', required=True, help='Path to .env file')
    parser.add_argument('--output', required=True, help='Path to output values-local.yaml')
    args = parser.parse_args()

    # Parse env file
    env_vars = parse_env_file(args.env_file)
    
    # Map env vars to values keys
    flat_values = {}
    for env_key, env_value in env_vars.items():
        if env_key in ENV_TO_VALUES and env_value:  # Only emit non-empty values
            values_key = ENV_TO_VALUES[env_key]
            # Type conversion for known boolean/numeric fields
            if env_value.lower() in ['true', 'false']:
                env_value = env_value.lower() == 'true'
            elif re.match(r'^-?\d+$', env_value):
                env_value = int(env_value)
            elif re.match(r'^-?\d+\.\d+$', env_value):
                env_value = float(env_value)
            flat_values[values_key] = env_value
    
    # Build nested dict
    nested_values = build_nested_dict(flat_values)
    
    # Generate YAML
    header = """# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Auto-generated by generate-values-local.py — DO NOT COMMIT

"""
    yaml_content = header + dict_to_yaml(nested_values)
    
    # Write output
    with open(args.output, 'w') as f:
        f.write(yaml_content)
    
    print(f"✅ Generated {args.output} with {len(flat_values)} values")


if __name__ == '__main__':
    main()

#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

set -e

# Generate config.ini.php with trusted_hosts from environment variable
TRUSTED_HOST="${MATOMO_TRUSTED_HOST:-localhost}"

cat > /var/www/html/config/config.ini.php << EOF
; <?php exit; ?> DO NOT REMOVE THIS LINE
; file automatically generated or modified by Matomo; you can manually override the default values in global.ini.php by redefining them in this file.
[General]
force_ssl = 1
assume_secure_protocol = 1
proxy_uri_header = 1
trusted_hosts[] = "$TRUSTED_HOST"
proxy_client_headers[] = "HTTP_X_FORWARDED_PREFIX"

; Optimized configuration for Matomo widget embedding
enable_framed_pages = 1
enable_framed_settings = 1
enable_framed_allow_write_admin_token_auth = 1
disable_merged_assets = 1
auto_redirect = 0
enable_framed_mode = 1
disable_frame_busting = 1
EOF

# Set correct permissions
chown www-data:www-data /var/www/html/config/config.ini.php
chmod 644 /var/www/html/config/config.ini.php

echo "Config file generated with trusted_hosts: $TRUSTED_HOST"

# Execute the original Matomo entrypoint
exec /entrypoint.sh "$@"

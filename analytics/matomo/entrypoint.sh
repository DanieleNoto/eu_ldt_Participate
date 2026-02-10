#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

set -e

# Verify and update config.ini.php with required settings
TRUSTED_HOST="${MATOMO_TRUSTED_HOST:-localhost}"
CONFIG_FILE="/var/www/html/config/config.ini.php"

# Function to check if a setting exists in the config file
setting_exists() {
	local setting="$1"
	grep -q "^${setting}" "$CONFIG_FILE" 2>/dev/null
}

# Function to add a setting to the [General] section
add_setting() {
	local setting="$1"
	local value="$2"
	
	# Check if [General] section exists
	if grep -q "^\[General\]" "$CONFIG_FILE"; then
		# Add after [General] section
		sed -i "/^\[General\]/a ${setting} = ${value}" "$CONFIG_FILE"
	else
		# Add [General] section with the setting
		echo -e "\n[General]\n${setting} = ${value}" >> "$CONFIG_FILE"
	fi
	echo "Added setting: ${setting} = ${value}"
}

# Function to add array setting to the [General] section
add_array_setting() {
	local setting="$1"
	local value="$2"
	
	# Check if [General] section exists
	if grep -q "^\[General\]" "$CONFIG_FILE"; then
		# Add after [General] section
		sed -i "/^\[General\]/a ${setting}[] = \"${value}\"" "$CONFIG_FILE"
	else
		# Add [General] section with the setting
		echo -e "\n[General]\n${setting}[] = \"${value}\"" >> "$CONFIG_FILE"
	fi
	echo "Added array setting: ${setting}[] = \"${value}\""
}

# Create config directory if it doesn't exist
if ! mkdir -p "$(dirname "$CONFIG_FILE")"; then
    echo "Error: Cannot create config directory: $(dirname "$CONFIG_FILE")"
    exit 1
fi

# Create config file if it doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
	echo "; <?php exit; ?> DO NOT REMOVE THIS LINE" > "$CONFIG_FILE"
	echo "; file automatically generated or modified by Matomo; you can manually override the default values in global.ini.php by redefining them in this file." >> "$CONFIG_FILE"
	echo "[General]" >> "$CONFIG_FILE"
	echo "Config file created."
fi

# Verify and add required settings if missing
if ! setting_exists "force_ssl"; then
	add_setting "force_ssl" "1"
fi

if ! setting_exists "assume_secure_protocol"; then
	add_setting "assume_secure_protocol" "1"
fi

if ! setting_exists "proxy_uri_header"; then
	add_setting "proxy_uri_header" "1"
fi

if ! grep -q "trusted_hosts\[\].*=.*\"$TRUSTED_HOST\"" "$CONFIG_FILE" 2>/dev/null; then
	add_array_setting "trusted_hosts" "$TRUSTED_HOST"
fi

if ! grep -q 'proxy_client_headers\[\].*=.*"HTTP_X_FORWARDED_PREFIX"' "$CONFIG_FILE" 2>/dev/null; then
	add_array_setting "proxy_client_headers" "HTTP_X_FORWARDED_PREFIX"
fi

if ! setting_exists "enable_framed_pages"; then
	add_setting "enable_framed_pages" "1"
fi

if ! setting_exists "enable_framed_settings"; then
	add_setting "enable_framed_settings" "1"
fi

if ! setting_exists "enable_framed_allow_write_admin_token_auth"; then
	add_setting "enable_framed_allow_write_admin_token_auth" "1"
fi

if ! setting_exists "disable_merged_assets"; then
	add_setting "disable_merged_assets" "1"
fi

if ! setting_exists "auto_redirect"; then
	add_setting "auto_redirect" "0"
fi

if ! setting_exists "enable_framed_mode"; then
	add_setting "enable_framed_mode" "1"
fi

if ! setting_exists "disable_frame_busting"; then
	add_setting "disable_frame_busting" "1"
fi

# Set correct permissions
chown www-data:www-data "$CONFIG_FILE"
chmod 644 "$CONFIG_FILE"

echo "Config file verified and updated with required settings."

# Execute the original Matomo entrypoint
exec /entrypoint.sh "$@"

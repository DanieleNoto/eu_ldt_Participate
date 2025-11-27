# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# This decorator fixes the external_icon helper when asset_host is configured.
# The original implementation fails because asset_pack_path returns a full URL
# (e.g., https://example.com/decidim-packs/...) instead of a relative path,
# causing File.exist? to fail when joining with Rails.public_path.

Decidim::LayoutHelper.module_eval do
  # Override application_path to handle full URLs returned by asset_pack_path
  # when asset_host is configured in production environments.
  def application_path(path)
    img_path = asset_pack_path(path, host: "", protocol: :relative)

    # If img_path is a full URL (contains ://), extract just the path portion
    if img_path.include?("://")
      uri = URI.parse(img_path)
      img_path = uri.path
    end

    full_path = Rails.public_path.join(img_path.sub(%r{^/}, ""))
    return unless File.exist?(full_path)

    full_path
  end
end

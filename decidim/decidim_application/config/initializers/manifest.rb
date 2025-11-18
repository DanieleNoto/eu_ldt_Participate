# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro
# frozen_string_literal: true



# Add manifest.webmanifest to head tags
Rails.application.configure do
  config.after_initialize do
    # Add manifest link to head if not already present
    if defined?(Decidim)
      Decidim.configure do |decidim_config|
        # Add custom head tags including manifest
        decidim_config.head_extra_tags ||= []
        decidim_config.head_extra_tags << %(<link rel="manifest" href="/manifest.webmanifest">)
        decidim_config.head_extra_tags << %(<link rel="icon" href="/favicon.svg" type="image/svg+xml">)
        decidim_config.head_extra_tags << %(<meta name="theme-color" content="#d63031">)
        decidim_config.head_extra_tags << %(<meta name="apple-mobile-web-app-capable" content="yes">)
        decidim_config.head_extra_tags << %(<meta name="apple-mobile-web-app-status-bar-style" content="default">)
      end
    end
  end
end
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true


base_path = File.expand_path("..", __dir__)

# Registra il path dei pack per Shakapacker
Decidim::Webpacker.register_path("#{base_path}/app/packs")

# Registra l'entrypoint per questo engine
Decidim::Webpacker.register_entrypoints(
  decidim_admin_header_manifest: "#{base_path}/app/packs/entrypoints/decidim_admin_header_manifest.js"
)
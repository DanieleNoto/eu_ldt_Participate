# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

base_path = File.expand_path("..", __dir__)

Decidim::Shakapacker.register_path("#{base_path}/app/packs")
Decidim::Shakapacker.register_entrypoints(
  decidim_ldt_map_visualization: "#{base_path}/app/packs/entrypoints/decidim_ldt_map_visualization.js"
)
Decidim::Shakapacker.register_stylesheet_import("stylesheets/decidim/ldt_map_visualization/ldt_map_visualization")

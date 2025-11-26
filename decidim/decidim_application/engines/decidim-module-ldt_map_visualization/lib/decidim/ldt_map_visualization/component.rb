# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

require "decidim/components/namer"

Decidim.register_component(:ldt_map_visualization) do |component|
  component.engine = Decidim::LdtMapVisualization::Engine
  component.admin_engine = Decidim::LdtMapVisualization::AdminEngine
  component.icon = "decidim/ldt_map_visualization/icon.svg"

  component.settings(:global) do |settings|
    # Add your global settings
    # Available types: :integer, :boolean
    settings.attribute :title, type: :string, default: ""
  end

end

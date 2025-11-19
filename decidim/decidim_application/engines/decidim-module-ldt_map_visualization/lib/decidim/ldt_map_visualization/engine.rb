# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

require "rails"
require "decidim/core"

module Decidim
  module LdtMapVisualization
    # This is the engine that runs on the public interface of ldt_map_visualization.
    class Engine < ::Rails::Engine
      isolate_namespace Decidim::LdtMapVisualization

      routes do
        # Add engine routes here
        resources :map_visualizations, only: [:index, :show]
        root to: "map_visualizations#index"
      end

      initializer "LdtMapVisualization.webpacker.assets_path" do
        Decidim.register_assets_path File.expand_path("app/packs", root)
      end
    end
  end
end

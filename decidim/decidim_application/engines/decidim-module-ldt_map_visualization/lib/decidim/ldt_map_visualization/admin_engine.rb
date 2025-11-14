# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



module Decidim
  module LdtMapVisualization
    # This is the engine that runs on the public interface of `LdtMapVisualization`.
    class AdminEngine < ::Rails::Engine
      isolate_namespace Decidim::LdtMapVisualization::Admin

      paths["db/migrate"] = nil
      paths["lib/tasks"] = nil

      routes do
        # Add admin engine routes here
        resources :map_visualizations, only: [:index, :new, :create, :edit, :update, :destroy] do
          collection do
            get :external_maps
            get :debug_token
          end
        end

        # Engine root should point to the map_visualizations index
        root to: "map_visualizations#index"
      end

      def load_seed
        nil
      end
    end
  end
end
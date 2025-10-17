# frozen_string_literal: true

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
            resources :exports, only: [:create]
          end
        end
        root to: "map_visualizations#index"
      end

      def load_seed
        nil
      end
    end
  end
end

# frozen_string_literal: true

module Decidim
  module LdtMapVisualization
    class MapVisualizationsController < Decidim::Components::BaseController
      def index
        @map_visualizations = collection
      end

      private

      def collection
        # TODO: Implement actual model when needed
        # For now, return empty array
        []
      end
    end
  end
end

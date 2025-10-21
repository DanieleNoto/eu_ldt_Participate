# frozen_string_literal: true

module Decidim
  module LdtMapVisualization
    class DestroyMapVisualization < ::Rectify::Command
      def initialize(map_visualization)
        @map_visualization = map_visualization
      end

      def call
        return broadcast(:invalid) unless @map_visualization

        begin
          @map_visualization.destroy!
          broadcast(:ok)
        rescue ActiveRecord::RecordNotDestroyed => e
          Rails.logger.error("Failed to destroy map visualization #{@map_visualization.id}: #{e.message}")
          broadcast(:invalid)
        end
      end
    end
  end
end

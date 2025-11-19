# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

module Decidim
  module LdtMapVisualization
    # Public controller for citizens to view map visualizations
    class MapVisualizationsController < Decidim::Components::BaseController
      include Decidim::ApplicationHelper
      include Paginable

      helper_method :map_visualizations, :map_visualization

      def index
        @map_visualizations = paginated_map_visualizations
      end

      def show
        @map_visualization = map_visualization
      end

      private

      def paginated_map_visualizations
        @paginated_map_visualizations ||= paginate(map_visualizations)
      end

      def map_visualizations
        @map_visualizations ||= Decidim::LdtMapVisualization::MapVisualization
                                .where(component: current_component)
                                .order(created_at: :desc)
      end

      alias collection map_visualizations

      def map_visualization
        @map_visualization ||= map_visualizations.find(params[:id])
      end
    end
  end
end

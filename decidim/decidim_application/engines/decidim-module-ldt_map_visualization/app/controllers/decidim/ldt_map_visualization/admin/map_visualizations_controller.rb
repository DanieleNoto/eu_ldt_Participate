# frozen_string_literal: true

module Decidim
  module LdtMapVisualization
    module Admin
      class MapVisualizationsController < Decidim::Admin::Components::BaseController
        def index
          @map_visualizations = collection
        end

        def new
          @form = MapVisualizationForm.new
        end

        def create
          @form = MapVisualizationForm.from_params(params)

          CreateMapVisualization.call(@form) do
            on(:ok) do
              flash[:notice] = I18n.t("map_visualizations.create.success", scope: "decidim.ldt_map_visualization.admin")
              redirect_to admin_map_visualizations_path
            end

            on(:invalid) do
              flash.now[:alert] = I18n.t("map_visualizations.create.error", scope: "decidim.ldt_map_visualization.admin")
              render :new
            end
          end
        end

        def edit
          @map_visualization = collection.find(params[:id])
          @form = MapVisualizationForm.from_model(@map_visualization)
        end

        def update
          @map_visualization = collection.find(params[:id])
          @form = MapVisualizationForm.from_params(params)

          UpdateMapVisualization.call(@form, @map_visualization) do
            on(:ok) do
              flash[:notice] = I18n.t("map_visualizations.update.success", scope: "decidim.ldt_map_visualization.admin")
              redirect_to admin_map_visualizations_path
            end

            on(:invalid) do
              flash.now[:alert] = I18n.t("map_visualizations.update.error", scope: "decidim.ldt_map_visualization.admin")
              render :edit
            end
          end
        end

        def destroy
          @map_visualization = collection.find(params[:id])

          DestroyMapVisualization.call(@map_visualization) do
            on(:ok) do
              flash[:notice] = I18n.t("map_visualizations.destroy.success", scope: "decidim.ldt_map_visualization.admin")
            end

            on(:invalid) do
              flash[:alert] = I18n.t("map_visualizations.destroy.error", scope: "decidim.ldt_map_visualization.admin")
            end
          end

          redirect_to admin_map_visualizations_path
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
end

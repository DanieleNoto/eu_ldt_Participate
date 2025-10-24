# frozen_string_literal: true

module Decidim
  module LdtMapVisualization
    # Minimal form object used by the admin controller to accept/create map visualizations.
    # It implements the small API expected by the controller: .new, .from_params, .from_model
    class MapVisualizationForm
      include ActiveModel::Model

      attr_accessor :name, :map_id, :map_data

      # Build from strong params-like hash
      def self.from_params(params)
        form = new
        if params.respond_to?(:require)
          begin
            permitted = params.require(:map_visualization).permit(:name, :map_id, :map_data)
          rescue => _e
            permitted = {}
          end
        elsif params.is_a?(Hash)
          permitted = params[:map_visualization] || {}
        else
          permitted = {}
        end

        permitted.each do |k, v|
          form.public_send("#{k}=", v) if form.respond_to?("#{k}=")
        end

        form
      end

      # Build from a model-like object
      def self.from_model(model)
        return new unless model
        new.tap do |f|
          f.name = model.name if model.respond_to?(:name)
          f.map_id = model.map_id if model.respond_to?(:map_id)
          f.map_data = model.map_data if model.respond_to?(:map_data)
        end
      end
    end
  end
end

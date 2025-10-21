# frozen_string_literal: true

module Decidim
  module LdtMapVisualization
    # Service to create a MapVisualization record from the form
    class CreateMapVisualization
      def self.call(form, current_component)
        new(form, current_component).call
      end

      def initialize(form, current_component)
        @form = form
        @current_component = current_component
      end

      def call
        return yield :invalid if block_given? && !valid?
        
        transaction do
          create_map_visualization!
          yield :ok if block_given?
        end
      rescue ActiveRecord::RecordInvalid => e
        Rails.logger.error("Failed to create map visualization: #{e.message}")
        yield :invalid if block_given?
      end

      private

      attr_reader :form, :current_component

      def valid?
        form.name.to_s.strip.present? && form.map_id.to_s.strip.present?
      end

      def transaction(&block)
        MapVisualization.transaction(&block)
      end

      def create_map_visualization!
        @map_visualization = MapVisualization.create!(
          component: current_component,
          name: form.name,
          map_id: form.map_id,
          map_data: form.map_data
        )
      end
    end
  end
end

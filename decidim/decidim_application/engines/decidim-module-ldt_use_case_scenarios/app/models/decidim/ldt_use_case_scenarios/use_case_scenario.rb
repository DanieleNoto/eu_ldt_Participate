# frozen_string_literal: true

module Decidim
  module LdtUseCaseScenarios
    class UseCaseScenario < ApplicationRecord
      include Decidim::Resourceable
      self.table_name = "decidim_ldt_use_case_scenarios_use_case_scenarios"

      belongs_to :component, class_name: "Decidim::Component", foreign_key: :decidim_component_id
      
      
      validates :name, presence: true
      validates :component, presence: true
      validates :experiment_id, presence: true
      
      store :experiment_data, accessors: [:experiment_name, :experiment_description, :experiment_status]

      # Custom setter to handle JSON string conversion
      def experiment_data=(value)
        if value.is_a?(String)
          begin
            parsed = JSON.parse(value)
            super(parsed)
          rescue JSON::ParserError => e
            Rails.logger.error("Failed to parse experiment_data JSON: #{e.message}")
            super({})
          end
        else
          super(value)
        end
      end

      validate :experiment_data_not_blank

      private

      def experiment_data_not_blank
        if experiment_data.blank? || (experiment_data.is_a?(Hash) && experiment_data.empty?)
          errors.add(:experiment_data, "cannot be blank")
        end
      end
    end
  end
end

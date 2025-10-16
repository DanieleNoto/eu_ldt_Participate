# frozen_string_literal: true

module Decidim
  module LdtUseCaseScenarios
    class UseCaseScenario < ApplicationRecord
      self.table_name = "decidim_ldt_use_case_scenarios_use_case_scenarios"

      belongs_to :component, class_name: "Decidim::Component", foreign_key: :decidim_component_id
      
      validates :name, presence: true
      validates :component, presence: true
      validates :experiment_id, presence: true
      validates :experiment_data, presence: true

      store :experiment_data, accessors: [:experiment_name, :experiment_description, :experiment_status]
    end
  end
end

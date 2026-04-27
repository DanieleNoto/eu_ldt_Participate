# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

module Decidim
  module LdtUseCaseScenarios
    class UseCaseScenario < ApplicationRecord
      include Decidim::HasComponent
      include Decidim::Resourceable
      include Decidim::Traceable

      self.table_name = "decidim_ldt_use_case_scenarios_use_case_scenarios"

      component_manifest_name "ldt_use_case_scenarios"

      validates :name, presence: true
      validates :experiment_id, presence: true

      store_accessor :experiment_data, :experiment_name, :experiment_description, :experiment_status

      validate :experiment_data_not_blank

      private

      def experiment_data_not_blank
        errors.add(:experiment_data, "cannot be blank") if experiment_data.blank? || (experiment_data.is_a?(Hash) && experiment_data.empty?)
      end
    end
  end
end

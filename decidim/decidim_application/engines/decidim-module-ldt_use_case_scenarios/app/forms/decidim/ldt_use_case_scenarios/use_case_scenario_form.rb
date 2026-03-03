# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

module Decidim
  module LdtUseCaseScenarios
    # Minimal form object used by the admin controller to accept/create use case scenarios.
    # It implements the small API expected by the controller: .new, .from_params, .from_model
    class UseCaseScenarioForm
      include ActiveModel::Model

      attr_accessor :name, :experiment_id, :component_id

      validates :name, presence: true
      validates :experiment_id, presence: true

      # Build from strong params-like hash
      def self.from_params(params)
        form = new
        if params.respond_to?(:require)
          begin
            permitted = params.require(:use_case_scenario_form).permit(:name, :experiment_id, :component_id)
          rescue StandardError => _e
            permitted = {}
          end
        elsif params.is_a?(Hash)
          permitted = params[:use_case_scenario_form] || {}
        else
          permitted = {}
        end

        form.name          = permitted[:name]          || permitted["name"]
        form.experiment_id = permitted[:experiment_id] || permitted["experiment_id"]
        form.component_id  = permitted[:component_id]  || permitted["component_id"]

        form
      end

      # Build from a model-like object
      def self.from_model(model)
        return new unless model

        new.tap do |f|
          f.name = model.name if model.respond_to?(:name)
          f.experiment_id = model.experiment_id if model.respond_to?(:experiment_id)
          f.component_id = model.component_id if model.respond_to?(:component_id)
        end
      end
    end
  end
end

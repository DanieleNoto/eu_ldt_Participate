# frozen_string_literal: true

module Decidim
  module LdtUseCaseScenarios
    module Admin
      # This controller allows managing the LdtUseCaseScenarios component in the admin panel.
      class LdtUseCaseScenariosController < ApplicationController

        def index
          @use_case_scenarios = collection
        end

        def new
          @form = UseCaseScenarioForm.new
        end

        def create
          @form = UseCaseScenarioForm.new(use_case_scenario_params)
          
          if @form.valid?
            # Handle creation
            redirect_to index_path, notice: t(".success")
          else
            render :new
          end
        end

        def edit
          # @use_case_scenario = collection.find(params[:id])
          # @form = UseCaseScenarioForm.from_model(@use_case_scenario)
        end

        def update
          # Handle update
        end

        def destroy
          # Handle deletion
        end

        private

        def collection
          # Return an empty collection or your resource
          []
        end

        def use_case_scenario_params
          params.require(:use_case_scenario).permit(:name, :description)
        end
      end
    end
  end
end

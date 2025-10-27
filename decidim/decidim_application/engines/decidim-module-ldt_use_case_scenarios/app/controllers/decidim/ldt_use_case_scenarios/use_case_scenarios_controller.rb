# frozen_string_literal: true

module Decidim
  module LdtUseCaseScenarios
    # Exposes the Use Case Scenarios resources to citizens
    class UseCaseScenariosController < ApplicationController
      include Decidim::ApplicationHelper
      include Paginable

      helper_method :use_case_scenarios, :use_case_scenario

      def index
        @use_case_scenarios = paginated_use_case_scenarios
      end

      def show
        @use_case_scenario = use_case_scenario
        @tool2_iframe_url = ENV.fetch('TOOL2_IFRAME_URL', 'https://ucs-int.ldttoolbox.app/embed/experiment-execution')
      rescue ActiveRecord::RecordNotFound
        flash[:alert] = t("decidim.ldt_use_case_scenarios.use_case_scenarios.show.not_found")
        redirect_to use_case_scenarios_path
      end

      private

      def paginated_use_case_scenarios
        @paginated_use_case_scenarios ||= paginate(use_case_scenarios)
      end

      def use_case_scenarios
        @use_case_scenarios ||= UseCaseScenario
                                  .where(decidim_component_id: current_component.id)
                                  .order(created_at: :desc)
      end

      def use_case_scenario
        @use_case_scenario ||= use_case_scenarios.find(params[:id])
      end
    end
  end
end

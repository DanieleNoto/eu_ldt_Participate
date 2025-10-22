# frozen_string_literal: true

module Decidim
  module LdtUseCaseScenarios
    # Exposes the LdtUseCaseScenarios resources
    class UseCaseScenariosController < ApplicationController

      def index
        @use_case_scenarios = collection
      end

      private

      def collection
        # Return an empty collection or your resource
        # Modify this depending on your needs
        []
      end
    end
  end
end

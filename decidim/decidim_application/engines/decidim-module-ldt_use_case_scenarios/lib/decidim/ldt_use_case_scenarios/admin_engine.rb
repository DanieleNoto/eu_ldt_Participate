# frozen_string_literal: true

module Decidim
  module LdtUseCaseScenarios
    # This is the engine that runs on the public interface of `LdtUseCaseScenarios`.
    class AdminEngine < ::Rails::Engine
      isolate_namespace Decidim::LdtUseCaseScenarios::Admin

      paths["db/migrate"] = nil
      paths["lib/tasks"] = nil

      routes do
        # Add admin engine routes here
        resources :ldt_use_case_scenarios, only: [:index, :new, :create, :edit, :update, :destroy] do
          collection do
            resources :exports, only: [:create]
          end
        end
        root to: "ldt_use_case_scenarios#index"
      end

      def load_seed
        nil
      end
    end
  end
end

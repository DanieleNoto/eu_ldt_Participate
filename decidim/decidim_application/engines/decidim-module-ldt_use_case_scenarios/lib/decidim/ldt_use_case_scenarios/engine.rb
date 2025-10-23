# frozen_string_literal: true

require "rails"
require "decidim/core"

module Decidim
  module LdtUseCaseScenarios
    # This is the engine that runs on the public interface of ldt_use_case_scenarios.
    class Engine < ::Rails::Engine
      isolate_namespace Decidim::LdtUseCaseScenarios

      routes do
        # Add engine routes here
        resources :use_case_scenarios, only: [:index, :new, :create]
        root to: "use_case_scenarios#index"
      end

      initializer "LdtUseCaseScenarios.webpacker.assets_path" do
        Decidim.register_assets_path File.expand_path("app/packs", root)
      end
    end
  end
end

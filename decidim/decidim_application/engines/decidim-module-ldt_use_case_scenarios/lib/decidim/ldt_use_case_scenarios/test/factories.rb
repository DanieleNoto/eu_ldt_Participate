# frozen_string_literal: true

require "decidim/components/namer"
require "decidim/core/test/factories"

FactoryBot.define do
  factory :ldt_use_case_scenarios_component, parent: :component do
    name { Decidim::Components::Namer.new(participatory_space.organization.available_locales, :ldt_use_case_scenarios).i18n_name }
    manifest_name :ldt_use_case_scenarios
    participatory_space { create(:participatory_process, :with_steps) }
  end

  # Add engine factories here
end

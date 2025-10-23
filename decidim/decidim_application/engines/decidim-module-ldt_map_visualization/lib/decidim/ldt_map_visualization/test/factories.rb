# frozen_string_literal: true

require "decidim/components/namer"
require "decidim/core/test/factories"

FactoryBot.define do
  factory :ldt_map_visualization_component, parent: :component do
    name { Decidim::Components::Namer.new(participatory_space.organization.available_locales, :ldt_map_visualization).i18n_name }
    manifest_name :ldt_map_visualization
    participatory_space { create(:participatory_process, :with_steps) }
  end

  # Add engine factories here
end

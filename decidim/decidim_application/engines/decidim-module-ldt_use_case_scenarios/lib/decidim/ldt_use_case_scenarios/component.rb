# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

require "decidim/components/namer"

Decidim.register_component(:ldt_use_case_scenarios) do |component|
  component.engine = Decidim::LdtUseCaseScenarios::Engine
  component.admin_engine = Decidim::LdtUseCaseScenarios::AdminEngine
  component.icon = "decidim/ldt_use_case_scenarios/icon.svg"

  # component.on(:before_destroy) do |instance|
  #   # Code executed before removing the component
  # end

  # These actions permissions can be configured in the admin panel
  # component.actions = %w()

  component.settings(:global) do |settings|
    # Add your global settings
    # Available types: :integer, :boolean
    settings.attribute :title, type: :string, default: ""
  end

  # component.settings(:step) do |settings|
  #   # Add your settings per step
  # end

  # component.register_resource(:some_resource) do |resource|
  #   # Register a optional resource that can be references from other resources.
  #   resource.model_class_name = "Decidim::LdtUseCaseScenarios::SomeResource"
  #   resource.template = "decidim/ldt_use_case_scenarios/some_resources/linked_some_resources"
  # end

  # Register the UseCaseScenario resource so the component exposes a resource
  # that other parts of the application (menus, links, admin UI) can reference.
  component.register_resource(:use_case_scenario) do |resource|
    resource.card = "decidim/ldt_use_case_scenarios/use_case_scenarios"
    resource.model_class_name = "Decidim::LdtUseCaseScenarios::UseCaseScenario"
  end

  # component.register_stat :some_stat do |context, start_at, end_at|
  #   # Register some stat number to the application
  # end

  # component.seeds do |participatory_space|
  #   # Add some seeds for this component
  # end
end

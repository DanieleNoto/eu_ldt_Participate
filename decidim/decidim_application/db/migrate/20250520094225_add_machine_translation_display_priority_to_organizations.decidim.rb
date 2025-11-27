# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddMachineTranslationDisplayPriorityToOrganizations < ActiveRecord::Migration[5.2]
  class Organization < ApplicationRecord
    self.table_name = "decidim_organizations"
  end

  def change
    add_column :decidim_organizations, :machine_translation_display_priority, :string

    Organization.reset_column_information
    Organization.update_all(machine_translation_display_priority: :original) # rubocop:disable Rails/SkipsModelValidations

    change_column_default :decidim_organizations, :machine_translation_display_priority, "original"
    change_column_null :decidim_organizations, :machine_translation_display_priority, false
  end
end

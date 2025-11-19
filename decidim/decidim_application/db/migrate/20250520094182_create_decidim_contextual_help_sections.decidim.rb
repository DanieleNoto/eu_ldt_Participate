# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimContextualHelpSections < ActiveRecord::Migration[5.2]
  def change
    create_table :decidim_contextual_help_sections do |t|
      t.string :section_id, null: false
      t.references :organization, null: false
      t.jsonb :content, null: false
    end
  end
end

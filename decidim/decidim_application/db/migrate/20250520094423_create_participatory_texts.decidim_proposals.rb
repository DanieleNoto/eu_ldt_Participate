# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateParticipatoryTexts < ActiveRecord::Migration[5.2]
  def change
    create_table :decidim_proposals_participatory_texts do |t|
      t.jsonb :title
      t.jsonb :description
      t.belongs_to :decidim_component, null: false, index: { name: "idx_participatory_texts_on_decidim_component_id" }

      t.timestamps
    end
  end
end

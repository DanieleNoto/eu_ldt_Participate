# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimModuleSortitionsSortitions < ActiveRecord::Migration[5.1]
  def change
    create_table :decidim_module_sortitions_sortitions do |t|
      t.references :decidim_feature, index: { name: "index_sortitions__on_feature" }

      t.references :decidim_category,
                   foreign_key: true,
                   index: { name: "index_sortitions__on_category" }

      t.integer :decidim_proposals_feature_id,
                index: { name: "index_sortitions__on_proposals_feature" }

      t.integer :dice, null: false
      t.integer :target_items, null: false
      t.timestamp :request_timestamp, null: false
      t.jsonb :selected_proposals

      t.timestamps
    end
  end
end

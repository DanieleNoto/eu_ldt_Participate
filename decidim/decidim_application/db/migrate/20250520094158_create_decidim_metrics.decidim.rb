# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimMetrics < ActiveRecord::Migration[5.2]
  def change
    create_table :decidim_metrics do |t|
      t.date :day, null: false, index: true
      t.string :metric_type, null: false, index: true
      t.integer :cumulative, null: false
      t.integer :quantity, null: false
      t.references :decidim_organization, null: false, index: true
      t.references :participatory_space, polymorphic: true, index: { name: "index_metric_on_participatory_space_id_and_type" }
      t.references :related_object, polymorphic: true, index: { name: "index_metric_on_related_object_id_and_type" }
      t.references :decidim_category
    end
  end
end

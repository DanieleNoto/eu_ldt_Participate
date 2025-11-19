# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimCategorizations < ActiveRecord::Migration[5.1]
  def change
    create_table :decidim_categorizations do |t|
      t.references :decidim_category, foreign_key: true, null: false
      t.references :categorizable, polymorphic: true, null: false, index: { name: "decidim_categorizations_categorizable_id_and_type" }

      t.timestamps
    end
  end
end

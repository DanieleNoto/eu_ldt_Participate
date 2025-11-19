# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateReports < ActiveRecord::Migration[5.0]
  def change
    create_table :decidim_reports do |t|
      t.references :decidim_moderation, null: false, index: { name: "decidim_reports_moderation" }
      t.references :decidim_user, null: false, index: { name: "decidim_reports_user" }

      t.string :reason, null: false
      t.text :details

      t.timestamps
    end

    add_index :decidim_reports, [:decidim_moderation_id, :decidim_user_id], unique: true, name: "decidim_reports_moderation_user_unique"
  end
end

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimEditorImages < ActiveRecord::Migration[6.0]
  def change
    create_table :decidim_editor_images do |t|
      t.references :decidim_author, null: false, foreign_key: { to_table: :decidim_users }, index: { name: "decidim_editor_images_author" }
      t.references :decidim_organization, null: false, foreign_key: true, index: { name: "decidim_editor_images_constraint_organization" }

      t.timestamps
    end
  end
end

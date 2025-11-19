# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimProposals < ActiveRecord::Migration[5.0]
  def change
    create_table :decidim_proposals_proposals do |t|
      t.text :title, null: false
      t.text :body, null: false
      t.references :decidim_feature, index: true, null: false
      t.references :decidim_author, index: true
      t.references :decidim_category, index: true
      t.references :decidim_scope, index: true

      t.timestamps
    end
  end
end

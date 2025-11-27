# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimScopes < ActiveRecord::Migration[5.0]
  def change
    create_table :decidim_scopes do |t|
      t.string :name, null: false, index: :uniqueness
      t.references :decidim_organization, foreign_key: true, index: true
      t.timestamps
    end
  end
end

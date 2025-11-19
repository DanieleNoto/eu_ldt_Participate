# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateIdentities < ActiveRecord::Migration[5.0]
  def change
    create_table :decidim_identities do |t|
      t.string :provider, null: false
      t.string :uid, null: false
      t.references :decidim_user, null: false, index: true
    end

    add_index :decidim_identities, [:provider, :uid], unique: true
  end
end

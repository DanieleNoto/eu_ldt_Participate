# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class CreateDecidimInitiativesVotes < ActiveRecord::Migration[5.1]
  def change
    create_table :decidim_initiatives_votes do |t|
      t.references :decidim_initiative, null: false, index: true
      t.references :decidim_author, null: false, index: true
      t.integer :scope, null: false, default: 0

      t.timestamps
    end
  end
end

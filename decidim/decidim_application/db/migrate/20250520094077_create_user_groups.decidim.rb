# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateUserGroups < ActiveRecord::Migration[5.0]
  def change
    create_table :decidim_user_groups do |t|
      t.string :name, null: false
      t.string :document_number, null: false
      t.string :phone, null: false

      t.timestamps
    end
  end
end

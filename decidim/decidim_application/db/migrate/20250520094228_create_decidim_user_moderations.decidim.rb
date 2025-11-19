# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimUserModerations < ActiveRecord::Migration[5.2]
  def change
    create_table :decidim_user_moderations do |t|
      t.belongs_to :decidim_user, foreign_key: true
      t.integer :report_count, default: 0, null: false

      t.timestamps
    end
  end
end

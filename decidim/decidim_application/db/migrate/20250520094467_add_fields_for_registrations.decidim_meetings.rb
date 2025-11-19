# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddFieldsForRegistrations < ActiveRecord::Migration[5.1]
  def change
    add_column :decidim_meetings_meetings, :reserved_slots, :integer, null: false, default: 0
  end
end

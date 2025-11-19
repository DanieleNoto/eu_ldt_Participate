# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimReminderDeliveries < ActiveRecord::Migration[6.0]
  def change
    create_table :decidim_reminder_deliveries do |t|
      t.belongs_to :decidim_reminder, index: true, foreign_key: true
      t.timestamps
    end
  end
end

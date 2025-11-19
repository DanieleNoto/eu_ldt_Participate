# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddInitiativeNotificationDates < ActiveRecord::Migration[5.1]
  def change
    add_column :decidim_initiatives,
               :first_progress_notification_at, :datetime
    add_index :decidim_initiatives, :first_progress_notification_at

    add_column :decidim_initiatives,
               :second_progress_notification_at, :datetime
    add_index :decidim_initiatives, :second_progress_notification_at
  end
end

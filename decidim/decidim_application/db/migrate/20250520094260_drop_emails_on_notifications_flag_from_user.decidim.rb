# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class DropEmailsOnNotificationsFlagFromUser < ActiveRecord::Migration[5.1]
  class DecidimUser < ApplicationRecord
    self.table_name = :decidim_users
  end

  def change
    # rubocop:disable Rails/SkipsModelValidations
    DecidimUser.where(email_on_notification: true).update_all(notifications_sending_frequency: "real_time")
    # rubocop:enable Rails/SkipsModelValidations

    remove_column :decidim_users, :email_on_notification
  end
end

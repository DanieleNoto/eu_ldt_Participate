# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddUsersRegistrationModeToOrganizations < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_organizations, :users_registration_mode, :integer, default: 0, null: false
  end
end

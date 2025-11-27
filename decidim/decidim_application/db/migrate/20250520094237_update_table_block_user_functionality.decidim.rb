# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class UpdateTableBlockUserFunctionality < ActiveRecord::Migration[5.2]
  def change
    rename_column :decidim_user_suspensions, :suspending_user_id, :blocking_user_id
    rename_table :decidim_user_suspensions, :decidim_user_blocks
  end
end

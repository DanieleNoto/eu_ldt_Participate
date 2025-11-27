# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddDecidimUserGroupIdToDecidimInitiatives < ActiveRecord::Migration[5.1]
  def change
    add_column :decidim_initiatives,
               :decidim_user_group_id, :integer
    add_index :decidim_initiatives, :decidim_user_group_id
  end
end

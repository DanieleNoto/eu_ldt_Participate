# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class IndexForeignKeysInDecidimInitiatives < ActiveRecord::Migration[5.2]
  def change
    add_index :decidim_initiatives, :decidim_user_group_id
    add_index :decidim_initiatives, :scoped_type_id
  end
end

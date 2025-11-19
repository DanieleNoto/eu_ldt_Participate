# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddCommentableCounterCacheToInitiatives < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_initiatives, :comments_count, :integer, null: false, default: 0
    add_index :decidim_initiatives, :comments_count
    Decidim::Initiative.reset_column_information
    Decidim::Initiative.find_each(&:update_comments_count)
  end
end

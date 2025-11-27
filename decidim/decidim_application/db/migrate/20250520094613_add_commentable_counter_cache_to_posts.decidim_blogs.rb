# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddCommentableCounterCacheToPosts < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_blogs_posts, :comments_count, :integer, null: false, default: 0
    add_index :decidim_blogs_posts, :comments_count
    Decidim::Blogs::Post.reset_column_information
    Decidim::Blogs::Post.unscoped.find_each(&:update_comments_count)
  end
end

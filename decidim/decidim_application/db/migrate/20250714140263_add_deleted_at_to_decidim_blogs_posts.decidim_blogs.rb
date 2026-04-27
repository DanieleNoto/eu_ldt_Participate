# frozen_string_literal: true

# This migration comes from decidim_blogs (originally 20240828103324)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class AddDeletedAtToDecidimBlogsPosts < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_blogs_posts, :deleted_at, :datetime
    add_index :decidim_blogs_posts, :deleted_at
  end
end

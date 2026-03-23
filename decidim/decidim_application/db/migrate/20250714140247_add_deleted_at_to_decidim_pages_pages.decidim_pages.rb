# frozen_string_literal: true

# This migration comes from decidim_pages (originally 20240828103537)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:59 UTC
class AddDeletedAtToDecidimPagesPages < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_pages_pages, :deleted_at, :datetime
    add_index :decidim_pages_pages, :deleted_at
  end
end

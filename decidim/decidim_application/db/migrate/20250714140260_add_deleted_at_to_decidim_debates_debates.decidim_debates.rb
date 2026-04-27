# frozen_string_literal: true

# This migration comes from decidim_debates (originally 20240828103648)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:59 UTC
class AddDeletedAtToDecidimDebatesDebates < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_debates_debates, :deleted_at, :datetime
    add_index :decidim_debates_debates, :deleted_at
  end
end

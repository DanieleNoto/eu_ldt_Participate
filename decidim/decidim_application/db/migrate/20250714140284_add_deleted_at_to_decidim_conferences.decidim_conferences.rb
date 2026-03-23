# frozen_string_literal: true

# This migration comes from decidim_conferences (originally 20240822161330)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class AddDeletedAtToDecidimConferences < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_conferences, :deleted_at, :datetime
    add_index :decidim_conferences, :deleted_at
  end
end

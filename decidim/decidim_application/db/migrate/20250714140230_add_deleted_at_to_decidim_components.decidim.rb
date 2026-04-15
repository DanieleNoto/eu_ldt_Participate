# frozen_string_literal: true

# This migration comes from decidim (originally 20240822161348)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class AddDeletedAtToDecidimComponents < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_components, :deleted_at, :datetime
    add_index :decidim_components, :deleted_at
  end
end

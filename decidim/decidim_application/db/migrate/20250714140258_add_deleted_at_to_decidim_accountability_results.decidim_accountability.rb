# frozen_string_literal: true

# This migration comes from decidim_accountability (originally 20240828103202)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class AddDeletedAtToDecidimAccountabilityResults < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_accountability_results, :deleted_at, :datetime
    add_index :decidim_accountability_results, :deleted_at
  end
end

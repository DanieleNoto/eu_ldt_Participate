# frozen_string_literal: true

# This migration comes from decidim (originally 20241028114430)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class AddComponentCounterToTaxonomyFilters < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_taxonomy_filters, :components_count, :integer, null: false, default: 0
  end
end

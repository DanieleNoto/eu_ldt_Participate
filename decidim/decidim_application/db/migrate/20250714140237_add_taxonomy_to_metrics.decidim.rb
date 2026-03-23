# frozen_string_literal: true

# This migration comes from decidim (originally 20241127093708)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class AddTaxonomyToMetrics < ActiveRecord::Migration[7.0]
  def change
    add_reference :decidim_metrics, :decidim_taxonomy, index: true
  end
end

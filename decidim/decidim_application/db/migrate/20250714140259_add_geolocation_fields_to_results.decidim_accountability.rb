# frozen_string_literal: true

# This migration comes from decidim_accountability (originally 20240916112128)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class AddGeolocationFieldsToResults < ActiveRecord::Migration[6.1]
  def change
    add_column :decidim_accountability_results, :address, :text
    add_column :decidim_accountability_results, :latitude, :float
    add_column :decidim_accountability_results, :longitude, :float
  end
end

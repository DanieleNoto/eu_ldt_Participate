# frozen_string_literal: true

# This migration comes from decidim_initiatives (originally 20241127104718)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:59 UTC
class AddTaxonomyToInitiativesTypeScope < ActiveRecord::Migration[7.0]
  def change
    add_reference :decidim_initiatives_type_scopes, :decidim_taxonomy, index: true
  end
end

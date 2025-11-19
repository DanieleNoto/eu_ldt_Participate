# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddNamesAndSpaceBooleanToTaxonomyFilters < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_taxonomy_filters, :name, :jsonb, default: {}
    add_column :decidim_taxonomy_filters, :internal_name, :jsonb, default: {}
    add_column :decidim_taxonomy_filters, :space_filter, :boolean, null: false, default: false
  end
end

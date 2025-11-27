# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddGeolocationFieldsToResults < ActiveRecord::Migration[6.1]
  def change
    add_column :decidim_accountability_results, :address, :text
    add_column :decidim_accountability_results, :latitude, :float
    add_column :decidim_accountability_results, :longitude, :float
  end
end

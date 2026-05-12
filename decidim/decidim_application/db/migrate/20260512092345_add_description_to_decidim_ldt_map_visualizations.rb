# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

class AddDescriptionToDecidimLdtMapVisualizations < ActiveRecord::Migration[6.1]
  def change
    add_column :decidim_ldt_map_visualizations, :description, :text
  end
end

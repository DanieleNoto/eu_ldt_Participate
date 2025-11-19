# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

class CreateDecidimAwesomeConfigConstraints < ActiveRecord::Migration[5.2]
  def change
    create_table :decidim_awesome_config_constraints do |t|
      t.jsonb :settings

      t.references :decidim_awesome_config, null: false, foreign_key: { to_table: :decidim_awesome_config }, index: { name: "decidim_awesome_config_constraints_config" }
      t.timestamps
      t.index [:settings, :decidim_awesome_config_id], name: "index_decidim_awesome_settings_awesome_config", unique: true
    end
  end
end

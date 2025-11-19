# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

class ChangeAwesomeConfigVarType < ActiveRecord::Migration[5.2]
  def change
    change_column :decidim_awesome_config, :var, :string

    Decidim::DecidimAwesome::AwesomeConfig.find_each do |config|
      config.var.gsub!('"', "")
      config.save!
    end
  end
end

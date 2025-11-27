# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class CreateDecidimInitiativesSettings < ActiveRecord::Migration[5.2]
  def change
    create_table :decidim_initiatives_settings do |t|
      t.string :initiatives_order, default: "random"
      t.references :decidim_organization, foreign_key: true, index: true
    end
  end
end

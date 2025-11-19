# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateAccountabilityStatuses < ActiveRecord::Migration[5.0]
  def change
    create_table :decidim_accountability_statuses do |t|
      t.string :key
      t.jsonb :name
      t.references :decidim_feature, index: true

      t.timestamps
    end
  end
end

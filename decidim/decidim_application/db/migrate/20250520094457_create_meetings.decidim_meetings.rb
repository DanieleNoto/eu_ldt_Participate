# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateMeetings < ActiveRecord::Migration[5.0]
  def change
    create_table :decidim_meetings_meetings do |t|
      t.jsonb :title
      t.jsonb :description
      t.jsonb :short_description
      t.datetime :start_time
      t.datetime :end_time
      t.text :address
      t.jsonb :location
      t.jsonb :location_hints
      t.references :decidim_feature, index: true
      t.references :decidim_author, index: true
      t.references :decidim_scope, index: true
      t.references :decidim_category, index: true

      t.timestamps
    end
  end
end

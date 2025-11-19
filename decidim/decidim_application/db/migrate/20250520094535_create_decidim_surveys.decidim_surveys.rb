# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimSurveys < ActiveRecord::Migration[5.0]
  def change
    create_table :decidim_surveys_surveys do |t|
      t.jsonb :title
      t.jsonb :description
      t.jsonb :tos
      t.references :decidim_feature, index: true
      t.datetime :published_at

      t.timestamps
    end
  end
end

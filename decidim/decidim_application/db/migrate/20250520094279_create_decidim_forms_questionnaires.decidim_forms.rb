# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimFormsQuestionnaires < ActiveRecord::Migration[5.0]
  def change
    create_table :decidim_forms_questionnaires do |t|
      t.jsonb :title
      t.jsonb :description
      t.jsonb :tos
      t.references :questionnaire_for, polymorphic: true, index: { name: "index_decidim_forms_questionnaires_questionnaire_for" }
      t.datetime :published_at

      t.timestamps
    end
  end
end

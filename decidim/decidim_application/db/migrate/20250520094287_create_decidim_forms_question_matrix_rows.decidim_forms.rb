# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimFormsQuestionMatrixRows < ActiveRecord::Migration[5.2]
  def change
    create_table :decidim_forms_question_matrix_rows do |t|
      t.references :decidim_question, index: { name: "index_decidim_forms_question_matrix_questionnaire_id" }
      t.integer :position, index: true
      t.jsonb :body
    end
  end
end

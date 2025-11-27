# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimSurveyQuestions < ActiveRecord::Migration[5.0]
  def change
    create_table :decidim_surveys_survey_questions do |t|
      t.jsonb :body
      t.references :decidim_survey, index: true

      t.timestamps
    end
  end
end

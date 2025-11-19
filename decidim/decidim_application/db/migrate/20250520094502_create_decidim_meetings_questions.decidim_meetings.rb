# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimMeetingsQuestions < ActiveRecord::Migration[6.0]
  def change
    create_table :decidim_meetings_questions do |t|
      t.references :decidim_questionnaire, index: true
      t.integer :position, index: true
      t.string :question_type
      t.jsonb :body
      t.integer :max_choices

      t.timestamps
    end
  end
end

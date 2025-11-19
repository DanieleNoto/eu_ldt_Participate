# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimMeetingsAnswerOptions < ActiveRecord::Migration[6.0]
  def change
    create_table :decidim_meetings_answer_options do |t|
      t.references :decidim_question, index: { name: "index_decidim_meetings_answer_options_question_id" }
      t.jsonb :body
    end
  end
end

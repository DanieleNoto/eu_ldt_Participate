# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddSaltToDecidimFormsQuestionnaires < ActiveRecord::Migration[5.2]
  class Questionnaire < ApplicationRecord
    self.table_name = :decidim_forms_questionnaires
  end

  def change
    add_column :decidim_forms_questionnaires, :salt, :string

    Questionnaire.find_each do |questionnaire|
      questionnaire.salt = Decidim::Tokenizer.random_salt
      questionnaire.save!
    end
  end
end

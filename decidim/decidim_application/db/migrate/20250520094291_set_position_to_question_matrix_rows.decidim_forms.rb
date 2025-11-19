# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class SetPositionToQuestionMatrixRows < ActiveRecord::Migration[5.2]
  def up
    execute "UPDATE decidim_forms_question_matrix_rows SET position = id"
  end

  def down
    execute "UPDATE decidim_forms_question_matrix_rows SET position = NULL"
  end
end

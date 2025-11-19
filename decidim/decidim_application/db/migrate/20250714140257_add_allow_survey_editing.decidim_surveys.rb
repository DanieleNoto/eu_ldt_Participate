# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddAllowSurveyEditing < ActiveRecord::Migration[7.0]
  def up
    add_column :decidim_surveys_surveys, :allow_editing_answers, :boolean
  end
end

# frozen_string_literal: true

# This migration comes from decidim_surveys (originally 20250115193836)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:59 UTC
class AddAllowSurveyEditing < ActiveRecord::Migration[7.0]
  def up
    add_column :decidim_surveys_surveys, :allow_editing_answers, :boolean
  end
end

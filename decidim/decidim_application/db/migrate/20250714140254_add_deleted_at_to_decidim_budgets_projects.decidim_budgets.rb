# frozen_string_literal: true

# This migration comes from decidim_budgets (originally 20240916135141)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class AddDeletedAtToDecidimBudgetsProjects < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_budgets_projects, :deleted_at, :datetime
    add_index :decidim_budgets_projects, :deleted_at
  end
end

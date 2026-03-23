# frozen_string_literal: true

# This migration comes from decidim_assemblies (originally 20241108141651)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class RemoveColumnShowStatisticsFromAssemblies < ActiveRecord::Migration[7.0]
  def change
    remove_column :decidim_assemblies, :show_statistics, :string
  end
end

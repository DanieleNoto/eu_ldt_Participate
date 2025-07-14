# frozen_string_literal: true

# This migration comes from decidim_assemblies (originally 20240712061153)
# This file has been modified by `decidim upgrade:migrations` task on 2025-07-14 14:02:31 UTC
class ChangeShowStatisticsFromDecidimAssemblies < ActiveRecord::Migration[7.0]
  def up
    change_column_default :decidim_assemblies, :show_statistics, from: false, to: true
  end

  def down
    change_column_default :decidim_assemblies, :show_statistics, from: true, to: false
  end
end

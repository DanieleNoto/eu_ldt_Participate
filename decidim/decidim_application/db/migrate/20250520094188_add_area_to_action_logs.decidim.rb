# frozen_string_literal: true

# This migration comes from decidim (originally 20181211090933)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class AddAreaToActionLogs < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_action_logs, :decidim_area_id, :integer
  end
end

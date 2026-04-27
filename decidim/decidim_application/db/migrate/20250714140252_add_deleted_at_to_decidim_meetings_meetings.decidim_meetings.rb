# frozen_string_literal: true

# This migration comes from decidim_meetings (originally 20240828103603)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:59 UTC
class AddDeletedAtToDecidimMeetingsMeetings < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_meetings_meetings, :deleted_at, :datetime
    add_index :decidim_meetings_meetings, :deleted_at
  end
end

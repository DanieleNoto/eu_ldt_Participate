# frozen_string_literal: true

# This migration comes from decidim_meetings (originally 20240130135858)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:59 UTC
class AddWithdrawnFieldsOnMeetings < ActiveRecord::Migration[6.1]
  class CustomMeeting < Decidim::Meetings::ApplicationRecord
    self.table_name = "decidim_meetings_meetings"
  end

  def up
    add_column :decidim_meetings_meetings, :withdrawn_at, :datetime

    CustomMeeting.where(state: "withdrawn").find_each do |meeting|
      meeting.withdrawn_at = meeting.updated_at
      meeting.save!
    end
  end

  def down
    # rubocop:disable Rails/SkipsModelValidations
    CustomMeeting.where.not(withdrawn_at: null).update_all(state: :withdrawn)
    # rubocop:enable Rails/SkipsModelValidations
    remove_column :decidim_meetings_meetings, :withdrawn_at
  end
end

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddFollowableCounterCacheToMeetings < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_meetings_meetings, :follows_count, :integer, null: false, default: 0
    add_index :decidim_meetings_meetings, :follows_count

    reversible do |dir|
      dir.up do
        Decidim::Meetings::Meeting.reset_column_information
        Decidim::Meetings::Meeting.unscoped.find_each do |record|
          record.class.reset_counters(record.id, :follows)
        end
      end
    end
  end
end

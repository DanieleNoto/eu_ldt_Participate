# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddCommentableCounterCacheToMeetings < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_meetings_meetings, :comments_count, :integer, null: false, default: 0
    Decidim::Meetings::Meeting.reset_column_information
    Decidim::Meetings::Meeting.unscoped.find_each(&:update_comments_count)
  end
end

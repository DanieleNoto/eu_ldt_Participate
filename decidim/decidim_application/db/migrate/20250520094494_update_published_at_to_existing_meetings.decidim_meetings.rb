# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class UpdatePublishedAtToExistingMeetings < ActiveRecord::Migration[5.2]
  class Meeting < ApplicationRecord
    self.table_name = :decidim_meetings_meetings
  end

  def change
    Meeting.reset_column_information

    Meeting.find_each do |meeting|
      if meeting.published_at.nil?
        meeting.published_at = meeting.created_at
        meeting.save!
      end
    end
  end
end

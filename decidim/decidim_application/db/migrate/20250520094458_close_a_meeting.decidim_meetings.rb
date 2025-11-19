# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CloseAMeeting < ActiveRecord::Migration[5.0]
  def change
    add_column :decidim_meetings_meetings, :closing_report, :jsonb
    add_column :decidim_meetings_meetings, :attendees_count, :integer
    add_column :decidim_meetings_meetings, :contributions_count, :integer
    add_column :decidim_meetings_meetings, :attending_organizations, :text
    add_column :decidim_meetings_meetings, :closed_at, :time
    add_index :decidim_meetings_meetings, :closed_at
  end
end

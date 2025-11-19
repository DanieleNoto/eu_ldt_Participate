# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class MoveLegacyDescriptionToTitleOfTimelineEntries < ActiveRecord::Migration[6.1]
  class TimelineEntry < ApplicationRecord
    self.table_name = :decidim_accountability_timeline_entries
  end

  def up
    TimelineEntry.find_each do |timeline_entry|
      timeline_entry.update!(title: timeline_entry.description, description: nil)
    end
  end
end

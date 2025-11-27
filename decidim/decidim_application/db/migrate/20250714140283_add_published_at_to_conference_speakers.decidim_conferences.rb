# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddPublishedAtToConferenceSpeakers < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_conference_speakers, :published_at, :datetime
    add_index :decidim_conference_speakers, :published_at
  end
end

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

# This migration comes from decidim_conferences (originally 20240613095855)
# This file has been modified by `decidim upgrade:migrations` task on 2025-12-09 10:59:48 UTC
class AddPublishedAtToConferenceSpeakers < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_conference_speakers, :published_at, :datetime, index: true
  end
end

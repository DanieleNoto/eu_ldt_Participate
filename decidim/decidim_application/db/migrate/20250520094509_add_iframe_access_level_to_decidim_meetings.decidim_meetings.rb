# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddIframeAccessLevelToDecidimMeetings < ActiveRecord::Migration[6.0]
  def change
    add_column :decidim_meetings_meetings, :iframe_access_level, :integer, default: 0
  end
end

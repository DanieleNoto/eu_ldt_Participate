# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddTimestampsToContentBlocks < ActiveRecord::Migration[6.0]
  def up
    add_timestamps :decidim_content_blocks, default: Time.zone.now
    change_column_default :decidim_content_blocks, :created_at, nil
    change_column_default :decidim_content_blocks, :updated_at, nil
  end

  def down
    remove_column :decidim_content_blocks, :updated_at
    remove_column :decidim_content_blocks, :created_at
  end
end

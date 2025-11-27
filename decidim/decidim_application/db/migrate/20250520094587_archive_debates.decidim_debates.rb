# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class ArchiveDebates < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_debates_debates, :archived_at, :datetime
    add_index :decidim_debates_debates, :archived_at
  end
end

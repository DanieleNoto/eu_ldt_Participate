# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimContentBlockAttachments < ActiveRecord::Migration[6.0]
  def change
    create_table :decidim_content_block_attachments do |t|
      t.string :name
      t.references :decidim_content_block, null: false, index: { name: "decidim_content_block_attachments_on_content_block" }
    end
  end
end

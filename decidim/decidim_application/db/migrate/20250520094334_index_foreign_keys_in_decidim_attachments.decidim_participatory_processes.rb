# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class IndexForeignKeysInDecidimAttachments < ActiveRecord::Migration[5.2]
  def change
    add_index :decidim_attachments, :attachment_collection_id
  end
end

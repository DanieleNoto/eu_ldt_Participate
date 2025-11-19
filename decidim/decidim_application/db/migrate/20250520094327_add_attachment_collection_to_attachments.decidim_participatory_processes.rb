# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddAttachmentCollectionToAttachments < ActiveRecord::Migration[5.1]
  def change
    add_column :decidim_attachments, :attachment_collection_id, :integer, null: true
    add_index :decidim_attachments, :attachment_collection_id, name: "index_decidim_attachments_attachment_collection_id"
    add_foreign_key :decidim_attachments, :decidim_attachment_collections, column: :attachment_collection_id, on_delete: :nullify,
                                                                           name: "fk_decidim_attachments_attachment_collection_id"
  end
end

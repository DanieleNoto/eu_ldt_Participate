# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddServiceNameToActiveStorageBlobs < ActiveRecord::Migration[6.0]
  def up
    return if column_exists?(:active_storage_blobs, :service_name)

    add_column :active_storage_blobs, :service_name, :string
    # rubocop:disable Lint/AssignmentInCondition
    # rubocop:disable Rails/SkipsModelValidations
    if configured_service = ActiveStorage::Blob.service.name
      ActiveStorage::Blob.unscoped.update_all(service_name: configured_service)
    end
    # rubocop:enable Lint/AssignmentInCondition
    # rubocop:enable Rails/SkipsModelValidations
    change_column :active_storage_blobs, :service_name, :string, null: false
  end

  def down
    remove_column :active_storage_blobs, :service_name
  end
end

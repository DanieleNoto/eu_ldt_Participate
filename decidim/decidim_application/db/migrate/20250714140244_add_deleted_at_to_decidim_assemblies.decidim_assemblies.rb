# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddDeletedAtToDecidimAssemblies < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_assemblies, :deleted_at, :datetime
    add_index :decidim_assemblies, :deleted_at
  end
end

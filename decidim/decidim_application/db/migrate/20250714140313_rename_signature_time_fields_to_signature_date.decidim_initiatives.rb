# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class RenameSignatureTimeFieldsToSignatureDate < ActiveRecord::Migration[5.1]
  def change
    rename_column :decidim_initiatives, :signature_start_time, :signature_start_date
    rename_column :decidim_initiatives, :signature_end_time, :signature_end_date
  end
end

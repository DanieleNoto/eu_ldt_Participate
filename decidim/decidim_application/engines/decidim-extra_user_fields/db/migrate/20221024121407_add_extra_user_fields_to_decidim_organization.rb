# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro

# frozen_string_literal: true

class AddExtraUserFieldsToDecidimOrganization < ActiveRecord::Migration[6.0]
  def up
    add_column :decidim_organizations, :extra_user_fields, :jsonb, default: { "enabled" => false }
  end

  def down
    remove_column :decidim_organizations, :extra_user_fields, :jsonb
  end
end

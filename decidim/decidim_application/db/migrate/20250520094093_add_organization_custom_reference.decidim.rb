# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddOrganizationCustomReference < ActiveRecord::Migration[5.0]
  class Organization < ApplicationRecord
    self.table_name = :decidim_organizations
  end

  def change
    add_column :decidim_organizations, :reference_prefix, :string

    Organization.find_each do |organization|
      organization.update!(reference_prefix: organization.name[0])
    end

    change_column_null :decidim_organizations, :reference_prefix, false
  end
end

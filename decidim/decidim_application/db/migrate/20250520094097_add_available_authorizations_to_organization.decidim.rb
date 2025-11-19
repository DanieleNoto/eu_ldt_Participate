# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddAvailableAuthorizationsToOrganization < ActiveRecord::Migration[5.0]
  class Organization < ApplicationRecord
    self.table_name = :decidim_organizations
  end

  def change
    add_column :decidim_organizations, :available_authorizations, :string, array: true, default: []

    workflows = Decidim::Verifications.workflows.map(&:name)
    Organization.find_each do |org|
      org.update!(available_authorizations: workflows)
    end
  end
end

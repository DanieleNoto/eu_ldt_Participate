# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class MoveAuthorizationsToNewApi < ActiveRecord::Migration[5.1]
  class Organization < ApplicationRecord
    self.table_name = :decidim_organizations
  end

  class Component < ApplicationRecord
    self.table_name = :decidim_components
  end

  def up
    Organization.find_each do |organization|
      migrated_authorizations = organization.available_authorizations.map do |authorization|
        authorization.demodulize.underscore
      end

      organization.update!(available_authorizations: migrated_authorizations)
    end

    Component.find_each do |component|
      next if component.permissions.nil?

      component.permissions.transform_values! do |value|
        next if value.nil?

        {
          "authorization_handler_name" => value["authorization_handler_name"]&.classify&.demodulize&.underscore,
          "options" => value["options"]
        }
      end

      component.save!
    end
  end

  def down
    Organization.find_each do |organization|
      migrated_authorizations = organization.available_authorizations.map do |authorization|
        Decidim::Verifications.find_workflow_manifest(authorization).form
      end

      organization.update!(available_authorizations: migrated_authorizations)
    end

    Component.find_each do |component|
      component.permissions.transform_values! do |value|
        workflow = Decidim::Verifications.find_workflow_manifest(value)

        workflow.form.underscore
      end

      component.save!
    end
  end
end

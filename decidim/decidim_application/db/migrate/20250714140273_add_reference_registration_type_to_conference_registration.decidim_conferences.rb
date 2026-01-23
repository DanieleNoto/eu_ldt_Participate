# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

# This migration comes from decidim_conferences (originally 20181030090202)
# This file has been modified by `decidim upgrade:migrations` task on 2025-12-09 10:59:48 UTC
class AddReferenceRegistrationTypeToConferenceRegistration < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_conferences_conference_registrations, :decidim_conference_registration_type_id,
               :integer, index: { name: "idx_conference_registration_to_registration_type_id" }
    add_column :decidim_conferences_conference_registrations, :confirmed_at, :datetime, index: true
  end
end

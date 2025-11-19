# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddReferenceRegistrationTypeToConferenceRegistration < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_conferences_conference_registrations, :decidim_conference_registration_type_id,
               :integer
    add_index :decidim_conferences_conference_registrations, :decidim_conference_registration_type_id, name: "idx_conference_registration_to_registration_type_id"
    add_column :decidim_conferences_conference_registrations, :confirmed_at, :datetime
    add_index :decidim_conferences_conference_registrations, :confirmed_at
  end
end

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

# This migration comes from decidim_conferences (originally 20181030153614)
# This file has been modified by `decidim upgrade:migrations` task on 2025-12-09 10:59:48 UTC
class AddRegistrationTypeToConferenceInvite < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_conferences_conference_invites, :decidim_conference_registration_type_id,
               :integer, index: { name: "idx_conference_invite_to_registration_type_id" }
  end
end

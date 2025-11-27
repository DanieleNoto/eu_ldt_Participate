# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class ChangeDecidimIdentitiesProviderUidIndexUniqueness < ActiveRecord::Migration[5.0]
  def change
    remove_index :decidim_identities, [:provider, :uid]
    add_index :decidim_identities, [:provider, :uid, :decidim_organization_id], unique: true,
                                                                                name: "decidim_identities_provider_uid_organization_unique"

    Decidim::Identity.includes(:user).find_each do |identity|
      identity.organization = identity.user.organization
      identity.save!
    end
  end
end

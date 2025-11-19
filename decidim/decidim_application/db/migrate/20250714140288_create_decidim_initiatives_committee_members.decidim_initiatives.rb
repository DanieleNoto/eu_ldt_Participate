# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class CreateDecidimInitiativesCommitteeMembers < ActiveRecord::Migration[5.1]
  def change
    create_table :decidim_initiatives_committee_members do |t|
      t.references :decidim_initiatives, index: {
        name: "index_decidim_committee_members_initiative"
      }
      t.references :decidim_users, index: {
        name: "index_decidim_committee_members_user"
      }
      t.integer :state, index: true, null: false, default: 0

      t.timestamps
    end
  end
end

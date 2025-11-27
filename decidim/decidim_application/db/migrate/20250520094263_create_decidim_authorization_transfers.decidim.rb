# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateDecidimAuthorizationTransfers < ActiveRecord::Migration[6.1]
  def change
    create_table :decidim_authorization_transfers do |t|
      t.references :user, null: false, foreign_key: { to_table: :decidim_users }, index: true
      t.references :source_user, null: false, foreign_key: { to_table: :decidim_users }, index: true
      t.references :authorization, null: false, foreign_key: { to_table: :decidim_authorizations }, index: true

      t.datetime :created_at, null: false
    end

    create_table :decidim_authorization_transfer_records do |t|
      t.references :transfer, null: false, foreign_key: { to_table: :decidim_authorization_transfers }, index: true
      t.references :resource, polymorphic: true, null: false

      t.datetime :created_at, null: false
    end
  end
end

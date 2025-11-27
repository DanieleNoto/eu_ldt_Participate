# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateImpersonationLogs < ActiveRecord::Migration[5.1]
  def change
    create_table :decidim_impersonation_logs do |t|
      t.references :decidim_admin, index: true
      t.references :decidim_user, index: true
      t.datetime :started_at
      t.datetime :ended_at
      t.datetime :expired_at

      t.timestamps
    end
  end
end

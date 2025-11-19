# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddStatusToAuthorizations < ActiveRecord::Migration[5.1]
  def change
    add_column :decidim_authorizations, :granted_at, :datetime

    execute "UPDATE decidim_authorizations SET granted_at = updated_at"
  end
end

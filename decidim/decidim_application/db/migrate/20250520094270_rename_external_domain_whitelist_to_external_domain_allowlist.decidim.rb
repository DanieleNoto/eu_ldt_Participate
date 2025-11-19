# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class RenameExternalDomainWhitelistToExternalDomainAllowlist < ActiveRecord::Migration[6.1]
  def change
    rename_column :decidim_organizations, :external_domain_whitelist, :external_domain_allowlist
  end
end

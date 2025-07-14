# frozen_string_literal: true

# This migration comes from decidim (originally 20240110150230)
# This file has been modified by `decidim upgrade:migrations` task on 2025-07-14 14:02:53 UTC
class RenameExternalDomainWhitelistToExternalDomainAllowlist < ActiveRecord::Migration[6.1]
  def change
    rename_column :decidim_organizations, :external_domain_whitelist, :external_domain_allowlist
  end
end

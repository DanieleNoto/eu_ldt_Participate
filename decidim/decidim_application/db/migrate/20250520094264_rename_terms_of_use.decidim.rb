# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class RenameTermsOfUse < ActiveRecord::Migration[6.1]
  def change
    rename_column :decidim_organizations, :admin_terms_of_use_body, :admin_terms_of_service_body

    # rubocop:disable Rails/SkipsModelValidations
    reversible do |dir|
      dir.up do
        Decidim::StaticPage.where(slug: "terms-and-conditions").update_all(
          slug: "terms-of-service"
        )
      end

      dir.down do
        Decidim::StaticPage.where(slug: "terms-of-service").update_all(
          slug: "terms-and-conditions"
        )
      end
    end
    # rubocop:enable Rails/SkipsModelValidations
  end
end

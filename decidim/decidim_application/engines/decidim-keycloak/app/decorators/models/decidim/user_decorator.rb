# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Keycloak users must not be subject to Decidim's 90-day admin password expiry.
# Decidim does not manage their password — Keycloak does. Forcing them to change
# a Decidim password would either be silently ignored or break their login flow.
Decidim::User.class_eval do
  # Override: skip password expiry for users authenticated via Keycloak.
  # The original implementation only checks password_updated_at against the
  # configured expiration window, with no awareness of external identity providers.
  def needs_password_update?
    return false if identities.exists?(provider: "keycloakopenid")

    super
  end
end

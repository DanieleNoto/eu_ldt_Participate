# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Keycloak users must not be subject to Decidim's 90-day admin password expiry.
# Decidim does not manage their password — Keycloak does. Forcing them to change
# a Decidim password would either be silently ignored or break their login flow.
#
# prepend is required here: class_eval redefines the method in Decidim::User itself,
# making `super` look up UserBaseEntity (no match → NoMethodError). With prepend, the
# module sits BEFORE Decidim::User in the lookup chain, so `super` correctly resolves
# to the original Decidim::User#needs_password_update?.
module Decidim
  module KeycloakPasswordUpdateOverride
    # Override: skip password expiry for users authenticated via Keycloak.
    # The original implementation only checks password_updated_at against the
    # configured expiration window, with no awareness of external identity providers.
    def needs_password_update?
      return false if identities.exists?(provider: "keycloakopenid")

      super
    end
  end
end

Decidim::User.prepend(Decidim::KeycloakPasswordUpdateOverride)

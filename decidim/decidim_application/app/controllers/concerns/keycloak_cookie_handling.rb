# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Cookie management utilities for Keycloak authentication.
# Provides helper methods for clearing and validating Keycloak cookies.
#
# All operations are delegated to Decidim::Keycloak::CookieManager
# to maintain a single source of truth.
#
# @see Decidim::Keycloak::CookieManager
# @see KeycloakAuthentication
module KeycloakCookieHandling
  extend ActiveSupport::Concern

  private

  # Clear all Keycloak cookies from all possible domains
  # This prevents cookie accumulation and ensures clean logout
  def clear_keycloak_cookies
    Decidim::Keycloak::CookieManager.clear_all_cookies(cookies, request.host, session)
  end
end

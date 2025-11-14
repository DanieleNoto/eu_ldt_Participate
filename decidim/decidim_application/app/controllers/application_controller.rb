# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro
  # Marco Pinnella
  # Pierluigi Spedicato


class ApplicationController < ActionController::Base
  # REFACTORED: Keycloak Authentication - Modular Architecture
  # ========================================================
  # Authentication logic extracted into concerns for better maintainability:
  # - KeycloakAuthentication: login/logout/locale sync
  # - KeycloakTokenManagement: token refresh/validation
  # - KeycloakCookieHandling: cookie domain management
  #
  # Service Objects:
  # - Keycloak::TokenValidator: token validation logic
  # - Keycloak::LocaleSynchronizer: locale extraction/sync
  #
  # Benefits:
  # - Single Responsibility Principle
  # - Easier testing and maintenance
  # - Reusable across controllers
  # - Cleaner ApplicationController (~25 lines vs 540+ lines)
  #
  # Previous Issues Fixed:
  # - Logout URL generation bug
  # - Cookie domain inconsistencies
  # - Token duplication in production
  # - Locale sync across tools

  include KeycloakCookieHandling
  include KeycloakTokenManagement
  include KeycloakAuthentication

  # Add any application-specific controller logic here
  # (currently all Keycloak logic is in the concerns above)
end
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro
  # Marco Pinnella
  # Pierluigi Spedicato

class ApplicationController < ActionController::Base
  include KeycloakCookieHandling
  include KeycloakTokenManagement
  include KeycloakAuthentication
end
# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



Rails.application.config.to_prepare do
  # Load the SessionsController extension
  require Rails.root.join('app', 'controllers', 'decidim', 'devise', 'sessions_controller_extension')
  
  # Prepend the SessionsController extension to enable Keycloak Single Logout
  Decidim::Devise::SessionsController.prepend Decidim::Devise::SessionsControllerExtension
end
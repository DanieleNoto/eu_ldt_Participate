# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Handle application-level errors
class ErrorsController < ApplicationController
  skip_before_action :verify_authenticity_token
  skip_before_action :check_keycloak_background_auto_login
  skip_before_action :check_keycloak_auto_logout
  skip_before_action :check_keycloak_locale_sync

  def not_found
    render plain: "Not Found", status: :not_found
  end
end

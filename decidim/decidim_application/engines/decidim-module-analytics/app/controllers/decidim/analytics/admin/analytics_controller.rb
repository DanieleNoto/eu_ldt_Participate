# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

module Decidim
  module Analytics
    module Admin
      class AnalyticsController < Analytics::Admin::ApplicationController
        def index
          enforce_permission_to :update, :organization, organization: current_organization

          @server_address = Rails.application.credentials.dig(:matomo, :server_address) ||
                            Rails.application.secrets.dig(:matomo, :server_address)
          @site_id = Rails.application.credentials.dig(:matomo, :site_id) ||
                     Rails.application.secrets.dig(:matomo, :site_id)
          @token_auth = Rails.application.credentials.dig(:matomo, :token_auth) ||
                        Rails.application.secrets.dig(:matomo, :token_auth)
        end
      end
    end
  end
end

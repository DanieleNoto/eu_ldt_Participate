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

          @server_address = ENV["MATOMO_SERVER_ADDRESS"]
          @site_id = ENV["MATOMO_SITE_ID"]
          @token_auth = ENV["MATOMO_TOKEN_AUTH"]
        end
      end
    end
  end
end

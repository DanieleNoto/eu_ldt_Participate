# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

module Decidim
  module Analytics
    module Admin
      class StatisticsController < Analytics::Admin::ApplicationController
        def index
          enforce_permission_to :update, :organization, organization: current_organization

          # Get Grafana configuration from environment variables
          # Check if we have a full root URL configured first
          if ENV["GF_SERVER_ROOT_URL"].present?
            @grafana_url = ENV["GF_SERVER_ROOT_URL"]
          elsif ENV["GF_SERVER_DOMAIN"].present?
            # Use configured domain with appropriate protocol
            grafana_domain = ENV["GF_SERVER_DOMAIN"]
            grafana_protocol = grafana_domain.include?("localhost") ? "http" : "https"
            grafana_port = grafana_domain.include?("localhost") ? ":3001" : ""
            @grafana_url = "#{grafana_protocol}://#{grafana_domain}#{grafana_port}"
          else
            # Default to Grafana container name (internal Docker network)
            @grafana_url = "http://grafana:3000"
          end

          # Use OAuth login endpoint to trigger automatic Keycloak authentication
          # This ensures users already logged into Keycloak will be automatically
          # authenticated in Grafana without seeing the login page
          @dashboard_path = "/login/generic_oauth?orgId=1&theme=light"
        end
      end
    end
  end
end

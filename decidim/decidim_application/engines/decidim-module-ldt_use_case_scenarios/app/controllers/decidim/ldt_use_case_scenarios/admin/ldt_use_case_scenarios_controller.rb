# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

require "net/http"
require "uri"
require "cgi"

module Decidim
  module LdtUseCaseScenarios
    module Admin
      # This controller allows managing the LdtUseCaseScenarios component in the admin panel.
      class LdtUseCaseScenariosController < ApplicationController
        def index
          enforce_permission_to :read, :ldt_use_case_scenario
          @use_case_scenarios = collection.page(params[:page])
        end

        # Proxy endpoint to fetch experiment executions from the external TOOL2 API.
        # Uses Keycloak JWT token persisted in cookies during login.
        # Requires CSRF token handshake before fetching experiments.
        def external_experiments
          # Ensure token is valid (refresh if expired)
          jwt = fetch_valid_jwt_token

          unless jwt
            return render json: { error: "No valid Keycloak JWT token. Please log in again." }, status: :unauthorized
          end

          # Sanitize page and size parameters
          page = begin
            Integer(params[:page] || 0)
          rescue StandardError
            0
          end
          size = begin
            Integer(params[:size] || 10)
          rescue StandardError
            10
          end

          filter_execution_id  = sanitize_filter_uuid(params[:filter_execution_id])
          filter_experiment_id = sanitize_filter_uuid(params[:filter_experiment_id])
          filter_status        = sanitize_filter_status(params[:filter_status])

          Rails.logger.info("[LDT] external_experiments params: page=#{page} size=#{size} " \
                            "execution_id=#{filter_execution_id.inspect} " \
                            "experiment_id=#{filter_experiment_id.inspect} " \
                            "status=#{filter_status.inspect}")

          search_parts = []
          search_parts << "id::#{filter_execution_id}"             if filter_execution_id.present?
          search_parts << "experimentId::#{filter_experiment_id}"  if filter_experiment_id.present?
          search_parts << "status::#{filter_status}"               if filter_status.present?

          search_query = search_parts.map { |s| "&search=#{CGI.escape(s)}" }.join
          api_path     = "/experiment-executions?page=#{page}&size=#{size}&sort=updatedAt::DESC#{search_query}"
          Rails.logger.info("[LDT] external_experiments api_path=#{api_path}")

          result = fetch_from_tool2(jwt, api_path)

          if result[:error]
            Rails.logger.error("[LDT] external_experiments TOOL2 error: #{result[:error]}")
            return render json: { error: "Invalid request parameters" }, status: :bad_request
          end

          render json: result[:data]
        rescue JSON::ParserError => e
          Rails.logger.error("[LDT] external_experiments JSON parse error: #{e.message}")
          render json: { error: "parsing error: #{e.message}" }, status: :unprocessable_entity
        rescue StandardError => e
          Rails.logger.error("[LDT] external_experiments unexpected error: #{e.class} #{e.message}")
          render json: { error: "unexpected error: #{e.message}" }, status: :internal_server_error
        end

        # Fetch detailed experiment execution data from TOOL2 by ID
        # GET /experiment-executions/:experiment_id
        def experiment_detail
          # Ensure token is valid
          jwt = fetch_valid_jwt_token

          unless jwt
            return render json: { error: "No valid Keycloak JWT token" }, status: :unauthorized
          end

          # Validate and sanitize experiment_id to prevent path traversal
          experiment_id = validate_experiment_id(params[:experiment_id])
          return render json: { error: "Invalid experiment_id format" }, status: :bad_request unless experiment_id

          # Fetch experiment detail from TOOL2
          result = fetch_from_tool2(jwt, "/experiment-executions/#{experiment_id}")
          
          if result[:error]
            return render json: { error: "Invalid request" }, status: :bad_request
          end
          
          render json: result[:data]
        rescue JSON::ParserError => e
          render json: { error: "parsing error: #{e.message}" }, status: :unprocessable_entity
        rescue StandardError => e
          render json: { error: "unexpected error: #{e.message}" }, status: :internal_server_error
        end

        # Save experiment execution to use case scenario
        def save_experiment
          experiment_id = params[:experiment_id]
          scenario_name = params[:scenario_name]
          component_id = params[:component_id]

          # Validate experiment_id to prevent path traversal
          experiment_id = validate_experiment_id(experiment_id)
          return render json: { error: "Invalid experiment_id format" }, status: :bad_request unless experiment_id

          # Validate params
          return render json: { error: "Missing experiment_id or scenario_name" }, status: :bad_request unless scenario_name.present?

          # Get component_id from params or current_component
          comp_id = component_id || current_component&.id

          return render json: { error: "Component ID not found" }, status: :bad_request if comp_id.blank?

          # Step 1: Get JWT token
          jwt = fetch_valid_jwt_token

          unless jwt
            return render json: { error: "No valid Keycloak JWT token" }, status: :unauthorized
          end

          # Step 2: Fetch experiment detail from TOOL2
          result = fetch_from_tool2(jwt, "/experiment-executions/#{experiment_id}")
          
          if result[:error]
            return render json: { error: "Invalid request" }, status: :bad_request
          end
          
          experiment_data = result[:data]

          # Step 3: Create new scenario with experiment data from TOOL2
          @scenario = UseCaseScenario.new(
            name: scenario_name,
            experiment_id: experiment_id,
            experiment_data: experiment_data,
            decidim_component_id: comp_id
          )

          if @scenario.save
            flash[:notice] = I18n.t("create.experiment_saved", scope: "decidim.ldt_use_case_scenarios.admin")
            redirect_to ldt_use_case_scenarios_path
          else
            flash[:alert] = "Error saving experiment: #{@scenario.errors.full_messages.join(", ")}"
            redirect_to new_ldt_use_case_scenario_path
          end
        rescue ActiveRecord::RecordNotUnique => e
          flash[:alert] = I18n.t("create.duplicate_experiment", scope: "decidim.ldt_use_case_scenarios.admin")
          redirect_to ldt_use_case_scenarios_path
        rescue JSON::ParserError => e
          flash[:alert] = "Error parsing data from TOOL2: #{e.message}"
          redirect_to new_ldt_use_case_scenario_path
        rescue StandardError => e
          flash[:alert] = "Unexpected error: #{e.message}"
          redirect_to new_ldt_use_case_scenario_path
        end

        def new
          enforce_permission_to :create, :ldt_use_case_scenario
          @form = ::Decidim::LdtUseCaseScenarios::UseCaseScenarioForm.new
          fetch_experiments_for_form
        end

        def edit
          # @use_case_scenario = collection.find(params[:id])
          # @form = UseCaseScenarioForm.from_model(@use_case_scenario)
        end

        def create
          enforce_permission_to :create, :ldt_use_case_scenario
          @form = ::Decidim::LdtUseCaseScenarios::UseCaseScenarioForm.from_params(params)

          if @form.invalid?
            # Re-fetch experiments for the form
            fetch_experiments_for_form
            render :new
            return
          end

          begin
            experiment_id = @form.experiment_id
            scenario_name = @form.name

            # Validate params
            unless experiment_id.present? && scenario_name.present?
              flash[:alert] = I18n.t("ldt_use_case_scenarios.create.error", scope: "decidim.ldt_use_case_scenarios.admin")
              redirect_to new_ldt_use_case_scenario_path
              return
            end

            # Get JWT token for API access
            jwt = fetch_valid_jwt_token

            unless jwt
              flash[:alert] = I18n.t("create.no_valid_token", scope: "decidim.ldt_use_case_scenarios.admin")
              redirect_to new_ldt_use_case_scenario_path
              return
            end

            # Fetch experiment data from TOOL2 API
            result = fetch_from_tool2(jwt, "/experiment-executions/#{experiment_id}")
            
            if result[:error]
              flash[:alert] = "Invalid request parameters"
              redirect_to new_ldt_use_case_scenario_path
              return
            end
            
            experiment_data = result[:data]

            # Create new scenario
            @scenario = UseCaseScenario.new(
              name: scenario_name,
              experiment_id: experiment_id,
              experiment_data: experiment_data,
              decidim_component_id: current_component.id
            )

            if @scenario.save
              flash[:notice] = I18n.t("ldt_use_case_scenarios.create.success", scope: "decidim.ldt_use_case_scenarios.admin")
              redirect_to ldt_use_case_scenarios_path
            else
              flash[:alert] = @scenario.errors.full_messages.to_sentence
              redirect_to new_ldt_use_case_scenario_path
            end
          rescue StandardError => e
            flash[:alert] = "Error creating scenario: #{e.message}"
            redirect_to new_ldt_use_case_scenario_path
          end
        end

        def update
          # Handle update
        end

        def destroy
          # Ensure user has permission to destroy scenarios
          unless allowed_to? :destroy, :ldt_use_case_scenario
            flash[:alert] = t("decidim.admin.actions.not_allowed")
            redirect_to ldt_use_case_scenarios_path
            return
          end

          @scenario = collection.find_by(id: params[:id])

          unless @scenario
            flash[:alert] = t("decidim.admin.actions.not_found")
            redirect_to ldt_use_case_scenarios_path
            return
          end

          if @scenario.destroy
            flash[:notice] = t("decidim.admin.actions.deleted")
          else
            flash[:alert] = @scenario.errors.full_messages.to_sentence
          end
          redirect_to ldt_use_case_scenarios_path
        end

        private

        # Centralized method to fetch valid JWT token using Keycloak TokenService.
        # Uses cookies.to_h (not request.cookies) so that tokens refreshed by
        # before_action :check_keycloak_auto_logout are visible here, avoiding
        # a double-refresh with the same refresh token.
        #
        # TokenService can return :network_error (truthy Symbol) when Keycloak is
        # temporarily unreachable. We explicitly return nil in that case so callers
        # can show a proper error instead of sending "network_error" as a Bearer token.
        #
        # @return [String, nil] The valid JWT token string, or nil if unavailable
        def fetch_valid_jwt_token
          result = Decidim::Keycloak::TokenService.ensure_valid_token(
            current_user,
            cookies_hash: cookies.to_h,
            cookies_obj: cookies,
            request_host: request.host,
            controller: self
          )
          return nil unless result.is_a?(String) && result.present?

          result
        end

        def collection
          UseCaseScenario.where(decidim_component_id: current_component.id).order(updated_at: :desc)
        end

        def scenario_params
          params.require(:use_case_scenario_form).permit(:name, :experiment_id)
        end

        def current_component
          @current_component ||= Decidim::Component.find(params[:component_id])
        end

        def fetch_experiments_for_form

          # Ensure token is valid
          raw_token_result = Decidim::Keycloak::TokenService.ensure_valid_token(
            current_user,
            cookies_hash: cookies.to_h,
            cookies_obj: cookies,
            request_host: request.host,
            controller: self
          )

          jwt = raw_token_result.is_a?(String) && raw_token_result.present? ? raw_token_result : nil

          unless jwt
            @experiments = []
            @experiments_error = "No valid Keycloak JWT token. Please log in again."
            return
          end

          # Fetch experiments list (first page, sorted by last update)
          filter_status = sanitize_filter_status(params[:filter_status])
          search_str    = build_search_params(nil, filter_status)
          result = fetch_from_tool2(jwt, "/experiment-executions?page=0&size=10&sort=updatedAt::DESC#{search_str}")

          if result[:error]
            @experiments = []
            @experiments_error = "Invalid request parameters"
            return
          end

          # Extract experiments array
          experiments_data = result[:data]

          @experiments = if experiments_data.is_a?(Array)
                           experiments_data
                         elsif experiments_data.is_a?(Hash) && experiments_data["content"].is_a?(Array)
                           experiments_data["content"]
                         else
                           @experiments_error = I18n.t("fetch_experiments_error", scope: "decidim.ldt_use_case_scenarios.admin", default: "Unexpected response from the experiments service. Please try again.")
                           []
                         end

          @total_pages = if experiments_data.is_a?(Hash) && experiments_data["metadata"].is_a?(Hash)
                           metadata = experiments_data["metadata"]
                           total = metadata["total"].to_i
                           size = metadata["size"].to_i
                           size > 0 ? (total.to_f / size).ceil : 1
                         elsif experiments_data.is_a?(Hash)
                           (experiments_data["totalPages"] || 1).to_i
                         else
                           1
                         end
          @page_size = 10
          @experiments_error = nil unless @experiments_error
        rescue StandardError => e
          @experiments = []
          @experiments_error = "Error loading experiments: #{e.message}"
        end

        # Helper method to fetch data from TOOL2 API
        # Returns: { csrf_token: String, cookies: String, data: Hash }
        def fetch_from_tool2(jwt, endpoint_path)
          experiments_url = ENV["TOOL2_EXPERIMENTS_URL"] || "https://ucs-int.ldttoolbox.app/api/v1/experiment-executions"

          base_url = normalize_base_url(experiments_url)

          # Validate and sanitize endpoint_path to prevent path traversal
          validated_path = validate_endpoint_path(endpoint_path)
          return { error: "Invalid endpoint path" } unless validated_path

          # Log original JWT claims for debugging
          begin
            orig_payload = JWT.decode(jwt, nil, false).first
          rescue StandardError => e
          end

          # TOOL2 validates the JWT audience against its own Keycloak client ID.
          # If TOOL2_KEYCLOAK_CLIENT_ID is configured, exchange the Decidim token
          # for a token scoped to TOOL2's audience before calling the API.
          tool2_jwt = exchange_token_for_tool2(jwt)

          csrf_token, csrf_cookies = get_csrf_token(base_url, tool2_jwt)
          data_url = "#{base_url}#{validated_path}"

          data_response = make_api_request_with_retry(data_url, tool2_jwt, csrf_token, csrf_cookies)
          data = JSON.parse(data_response.body)

          {
            csrf_token: csrf_token,
            cookies: csrf_cookies,
            data: data
          }
        end

        # Exchange the Decidim access token for a TOOL2-scoped token if
        # TOOL2_KEYCLOAK_CLIENT_ID is set. Falls back to the original token
        # when no client ID is configured or exchange fails.
        # @param jwt [String] The Decidim access token
        # @return [String] The token to use with TOOL2
        def exchange_token_for_tool2(jwt)
          tool2_client_id = ENV["TOOL2_KEYCLOAK_CLIENT_ID"].presence
          unless tool2_client_id
            return jwt
          end

          exchanged = Decidim::Keycloak::TokenService.exchange_token_for_audience(jwt, tool2_client_id)

          if exchanged.present?
            # Decode and log the key claims so we can verify aud/azp
            begin
              payload = JWT.decode(exchanged, nil, false).first
            rescue StandardError => e
            end
            exchanged
          else
            jwt
          end
        end

        def reconstruct_token_from_cookies(cookies_hash, token_key)
          # Read token directly from cookie (no chunking)
          return nil unless cookies_hash

          cookies_hash[token_key]
        end

        def normalize_base_url(experiments_url)
          if experiments_url.end_with?("/experiment-executions")
            experiments_url.sub(%r{/experiment-executions$}, "")
          elsif experiments_url.end_with?("/experiments")
            experiments_url.sub(%r{/experiments$}, "")
          else
            experiments_url
          end
        end

        def get_csrf_token(base_url, jwt)
          csrf_url = "#{base_url}/csrf-token"
          uri = URI(csrf_url)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == "https"
          http.open_timeout = 5
          http.read_timeout = 10

          csrf_request = Net::HTTP::Get.new(uri)
          csrf_request["Authorization"] = "Bearer #{jwt}"
          csrf_request["Accept"] = "application/json"

          csrf_response_obj = http.request(csrf_request)
          csrf_response = csrf_response_obj.body
          csrf_json = begin
            JSON.parse(csrf_response)
          rescue StandardError => e
            {}
          end
          csrf_token = csrf_json["csrfToken"]
          csrf_cookies = csrf_response_obj["Set-Cookie"]

          unless csrf_token
            raise "Failed to obtain CSRF token from TOOL2"
          end

          [csrf_token, csrf_cookies]
        end

        def make_api_request_with_retry(data_url, jwt, csrf_token, csrf_cookies)
          data_uri = URI(data_url)
          data_http = Net::HTTP.new(data_uri.host, data_uri.port)
          data_http.use_ssl = data_uri.scheme == "https"
          data_http.open_timeout = 5
          data_http.read_timeout = 15

          data_request = Net::HTTP::Get.new(data_uri)
          data_request["Authorization"] = "Bearer #{jwt}"
          data_request["X-CSRF-Token"] = csrf_token
          data_request["Cookie"] = csrf_cookies if csrf_cookies
          data_request["Accept"] = "application/json"

          data_response = data_http.request(data_request)

          if data_response.code == "401"
            data_response = handle_unauthorized_retry(data_request, data_http, data_response)
          elsif data_response.code != "200"
            Rails.logger.error("[LDT] TOOL2 returned #{data_response.code} for #{data_url}. Body: #{data_response.body.to_s.first(500)}")
            raise "TOOL2 returned status #{data_response.code}"
          end

          data_response
        end

        def handle_unauthorized_retry(data_request, data_http, _original_response)

          # Use cookies.to_h so any prior refresh within this request is visible.
          # request.cookies is immutable (incoming HTTP), changes to the response
          # cookie jar are only visible via cookies.to_h.
          # Explicitly guard against :network_error (truthy Symbol) being used as a token.
          raw = Decidim::Keycloak::TokenService.ensure_valid_token(
            current_user,
            cookies_hash: cookies.to_h,
            cookies_obj: cookies,
            request_host: request.host,
            controller: self
          )
          jwt = raw.is_a?(String) && raw.present? ? raw : nil

          unless jwt
            raise "Authentication failed - please log in again"
          end

          # Retry with new token
          base_url = normalize_base_url(ENV["TOOL2_EXPERIMENTS_URL"] || "https://ucs-int.ldttoolbox.app/api/v1/experiment-executions")
          csrf_token, csrf_cookies = get_csrf_token(base_url, jwt)

          data_request["Authorization"] = "Bearer #{jwt}"
          data_request["X-CSRF-Token"] = csrf_token
          data_request["Cookie"] = csrf_cookies if csrf_cookies

          data_response = data_http.request(data_request)

          unless data_response.code == "200"
            raise "TOOL2 returned status #{data_response.code}"
          end

          data_response
        end

        # Validate endpoint path to prevent path traversal attacks
        # Only allows safe path characters and prevents directory traversal
        def validate_endpoint_path(endpoint_path)
          return nil unless endpoint_path.present?
          
          # Path must start with /
          return nil unless endpoint_path.start_with?("/")
          
          # Reject paths containing .. (parent directory references)
          return nil if endpoint_path.include?("..")
          
          # Reject null bytes
          return nil if endpoint_path.include?("\0")
          
          # Ensure path only contains safe URL characters
          # Allow: alphanumeric, /, -, _, ., ~, :, @, !, $, &, ', (, ), *, +, ,, ;, =, ?, and %xx
          return nil unless endpoint_path.match?(%r{\A/[\w\-/.~:@!$&'()*+,;=?%]*\z})
          
          endpoint_path
        end

        # Validates a full UUID (e.g. "cd054685-1234-5678-abcd-ef0123456789").
        # Returns nil for partial strings — partial UUIDs cause PostgreSQL validation errors in TOOL2.
        def sanitize_filter_uuid(value)
          return nil unless value.present?

          stripped = value.to_s.strip.downcase
          stripped.match?(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/) ? stripped : nil
        end

        # Validates a status filter against the known execution status enum values.
        def sanitize_filter_status(value)
          allowed = %w[DRAFT COMPLETED WORKFLOW_TRIGGERED INFERENCE_TRIGGERED FAILED DELETED]
          return nil unless value.present?

          upcase = value.to_s.upcase
          allowed.include?(upcase) ? upcase : nil
        end

        # Builds URL-encoded search query string fragments for the TOOL2 API.
        # Name filter is handled in Ruby (contains match) so only status is sent as a scope.
        # Status filter targets the direct `status` column (STRING type → iLike on the API side).
        def build_search_params(_filter_name, filter_status)
          return "" unless filter_status.present?

          "&search=#{CGI.escape("status::#{filter_status}")}"
        end

        # Validate experiment_id to prevent path traversal attacks
        # Only allows alphanumeric characters, hyphens, and underscores
        def validate_experiment_id(experiment_id)
          return nil unless experiment_id.present?

          # Only allow alphanumeric characters, hyphens, and underscores
          return nil unless experiment_id.match?(/\A[\w-]+\z/)

          experiment_id
        end
      end
    end
  end
end

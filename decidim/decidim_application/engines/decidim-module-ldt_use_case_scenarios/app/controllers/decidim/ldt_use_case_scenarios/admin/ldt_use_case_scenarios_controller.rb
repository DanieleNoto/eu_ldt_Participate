# frozen_string_literal: true

require 'net/http'
require 'uri'

module Decidim
  module LdtUseCaseScenarios
    module Admin
      # This controller allows managing the LdtUseCaseScenarios component in the admin panel.
      class LdtUseCaseScenariosController < ApplicationController

        def index
          @use_case_scenarios = collection
        end

        # Proxy endpoint to fetch experiment executions from the external TOOL2 API.
        # Uses Keycloak JWT token persisted in cookies during login.
        # Requires CSRF token handshake before fetching experiments.
        def external_experiments
          begin
            # Ensure token is valid (refresh if expired)
            jwt = Decidim::Keycloak::TokenService.ensure_valid_token(current_user, request.cookies)
            
            unless jwt
              Rails.logger.warn("No valid Keycloak JWT token available for user #{current_user&.id}")
              return render json: { error: "No valid Keycloak JWT token. Please log in again." }, status: :unauthorized
            end

            # Sanitize page and size parameters
            page = Integer(params[:page] || 0) rescue 0
            size = Integer(params[:size] || 100) rescue 100

            # Fetch experiments from TOOL2
            result = fetch_from_tool2(jwt, "/experiment-executions?page=#{page}&size=#{size}")
            render json: result[:data]
          rescue JSON::ParserError => e
            Rails.logger.error("JSON parsing error: #{e.message}")
            render json: { error: "parsing error: #{e.message}" }, status: :unprocessable_entity
          rescue => e
            Rails.logger.error("Unexpected error: #{e.message}")
            render json: { error: "unexpected error: #{e.message}" }, status: :internal_server_error
          end
        end

        # Fetch detailed experiment execution data from TOOL2 by ID
        # GET /experiment-executions/:experiment_id
        def experiment_detail
          begin
            # Ensure token is valid
            jwt = Decidim::Keycloak::TokenService.ensure_valid_token(current_user, request.cookies)
            
            unless jwt
              Rails.logger.warn("No valid Keycloak JWT token available")
              return render json: { error: "No valid Keycloak JWT token" }, status: :unauthorized
            end

            # Fetch experiment detail from TOOL2
            result = fetch_from_tool2(jwt, "/experiment-executions/#{params[:experiment_id]}")
            render json: result[:data]
          rescue JSON::ParserError => e
            Rails.logger.error("JSON parsing error: #{e.message}")
            render json: { error: "parsing error: #{e.message}" }, status: :unprocessable_entity
          rescue => e
            Rails.logger.error("Unexpected error: #{e.message}")
            render json: { error: "unexpected error: #{e.message}" }, status: :internal_server_error
          end
        end

        # Save experiment execution to use case scenario
        def save_experiment
          begin
            experiment_id = params[:experiment_id]
            scenario_name = params[:scenario_name]
            component_id = params[:component_id]
            
            # Validate params
            unless experiment_id.present? && scenario_name.present?
              return render json: { error: "Missing experiment_id or scenario_name" }, status: :bad_request
            end

            # Get component_id from params or current_component
            comp_id = component_id || (current_component&.id)
            
            unless comp_id.present?
              return render json: { error: "Component ID not found" }, status: :bad_request
            end

            # Step 1: Get JWT token
            jwt = Decidim::Keycloak::TokenService.ensure_valid_token(current_user, request.cookies)
            
            unless jwt
              Rails.logger.warn("No valid Keycloak JWT token available")
              return render json: { error: "No valid Keycloak JWT token" }, status: :unauthorized
            end

            # Step 2: Fetch experiment detail from TOOL2
            result = fetch_from_tool2(jwt, "/experiment-executions/#{experiment_id}")
            experiment_data = result[:data]

            # Step 3: Create new scenario with experiment data from TOOL2
            @scenario = UseCaseScenario.new(
              name: scenario_name,
              experiment_id: experiment_id,
              experiment_data: experiment_data,
              decidim_component_id: comp_id
            )

            if @scenario.save
              Rails.logger.info "Scenario saved successfully: #{@scenario.id}"
              flash[:notice] = "Experiment saved successfully!"
              redirect_to ldt_use_case_scenarios_path
            else
              Rails.logger.error("Failed to save scenario: #{@scenario.errors.full_messages.join(', ')}")
              flash[:alert] = "Error saving experiment: #{@scenario.errors.full_messages.join(', ')}"
              redirect_to new_ldt_use_case_scenario_path
            end
          rescue ActiveRecord::RecordNotUnique => e
            Rails.logger.error("Duplicate experiment: #{e.message}")
            flash[:alert] = "This experiment has already been saved for this component."
            redirect_to ldt_use_case_scenarios_path
          rescue JSON::ParserError => e
            Rails.logger.error("JSON parsing error: #{e.message}")
            flash[:alert] = "Error parsing data from TOOL2: #{e.message}"
            redirect_to new_ldt_use_case_scenario_path
          rescue => e
            Rails.logger.error("Unexpected error in save_experiment: #{e.class} - #{e.message}")
            flash[:alert] = "Unexpected error: #{e.message}"
            redirect_to new_ldt_use_case_scenario_path
          end
        end

        def new
          # Fetch experiments from TOOL2 when rendering the form
          begin
            # Ensure token is valid
            jwt = Decidim::Keycloak::TokenService.ensure_valid_token(current_user, request.cookies)
            
            unless jwt
              Rails.logger.warn("No valid Keycloak JWT token available")
              @experiments = []
              @experiments_error = "No valid Keycloak JWT token. Please log in again."
              return
            end

            # Fetch experiments list (first page, 100 results)
            result = fetch_from_tool2(jwt, "/experiment-executions?page=0&size=100")
            
            # Extract experiments array
            experiments_data = result[:data]
            @experiments = if experiments_data.is_a?(Array)
                            experiments_data
                          elsif experiments_data.is_a?(Hash) && experiments_data['content'].is_a?(Array)
                            experiments_data['content']
                          else
                            []
                          end
            
            @total_pages = experiments_data.is_a?(Hash) ? (experiments_data['totalPages'] || 1) : 1
          rescue => e
            Rails.logger.error("Error fetching experiments in new action: #{e.message}")
            @experiments = []
            @experiments_error = "Error loading experiments: #{e.message}"
          end
        end

        def create
          @scenario = UseCaseScenario.new(scenario_params)
          @scenario.decidim_component_id = current_component.id

          if @scenario.save
            # Return JSON response with redirect URL for the JavaScript to handle
            render json: { 
              success: true, 
              redirect_url: "/admin/participatory_processes/#{params[:participatory_process_slug]}/components/#{params[:component_id]}/manage/ldt_use_case_scenarios",
              message: t(".success")
            }, status: :ok
          else
            render json: { 
              success: false, 
              errors: @scenario.errors.full_messages 
            }, status: :unprocessable_entity
          end
        end

        def edit
          # @use_case_scenario = collection.find(params[:id])
          # @form = UseCaseScenarioForm.from_model(@use_case_scenario)
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
            redirect_to ldt_use_case_scenarios_path
          else
            flash[:alert] = @scenario.errors.full_messages.to_sentence
            redirect_to ldt_use_case_scenarios_path
          end
        end

        private

        def collection
          UseCaseScenario.where(decidim_component_id: current_component.id)
        end

        def scenario_params
          params.require(:use_case_scenario).permit(:name, :experiment_id, :experiment_data)
        end

        def current_component
          @current_component ||= Decidim::Component.find(params[:component_id])
        end

        # Helper method to fetch data from TOOL2 API
        # Returns: { csrf_token: String, cookies: String, data: Hash }
        def fetch_from_tool2(jwt, endpoint_path)
          experiments_url = ENV['TOOL2_EXPERIMENTS_URL'] || 'https://ucs-int.ldttoolbox.app/api/v1/experiment-executions'
          
          base_url = if experiments_url.end_with?('/experiment-executions')
                      experiments_url.sub(/\/experiment-executions$/, '')
                     elsif experiments_url.end_with?('/experiments')
                      experiments_url.sub(/\/experiments$/, '')
                     else
                      experiments_url
                     end
          
          csrf_url = "#{base_url}/csrf-token"
          data_url = "#{base_url}#{endpoint_path}"

          # Step 1: Get CSRF token
          uri = URI(csrf_url)
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == 'https'
          
          csrf_request = Net::HTTP::Get.new(uri)
          csrf_request['Authorization'] = "Bearer #{jwt}"
          csrf_request['Accept'] = 'application/json'
          
          csrf_response_obj = http.request(csrf_request)
          csrf_response = csrf_response_obj.body
          csrf_json = JSON.parse(csrf_response) rescue {}
          csrf_token = csrf_json["csrfToken"]
          csrf_cookies = csrf_response_obj['Set-Cookie']

          unless csrf_token
            Rails.logger.warn("Failed to obtain CSRF token from TOOL2")
            raise "Failed to obtain CSRF token from TOOL2"
          end

          # Step 2: Fetch data with CSRF token and JWT
          data_uri = URI(data_url)
          data_http = Net::HTTP.new(data_uri.host, data_uri.port)
          data_http.use_ssl = data_uri.scheme == 'https'
          
          data_request = Net::HTTP::Get.new(data_uri)
          data_request['Authorization'] = "Bearer #{jwt}"
          data_request['X-CSRF-Token'] = csrf_token
          data_request['Cookie'] = csrf_cookies if csrf_cookies
          data_request['Accept'] = 'application/json'
          
          data_response = data_http.request(data_request)
          
          unless data_response.code == '200'
            # If unauthorized (401), try refreshing token and retry once
            if data_response.code == '401'
              Rails.logger.warn("TOOL2 API returned 401 - attempting token refresh and retry")
              
              # Force token refresh
              refresh_token = reconstruct_token_from_cookies(request.cookies, 'keycloak_refresh_token')
              if refresh_token.present?
                new_tokens = Decidim::Keycloak::TokenService.new.send(:refresh_access_token, refresh_token)
                
                if new_tokens
                  # Save new tokens
                  Decidim::Keycloak::TokenService.new.save_tokens_to_cookies(cookies, new_tokens)
                  jwt = new_tokens[:access_token]
                  
                  # Retry CSRF token request first
                  csrf_request['Authorization'] = "Bearer #{jwt}"
                  csrf_response_obj = http.request(csrf_request)
                  csrf_response = csrf_response_obj.body
                  csrf_json = JSON.parse(csrf_response) rescue {}
                  csrf_token = csrf_json["csrfToken"]
                  csrf_cookies = csrf_response_obj['Set-Cookie']
                  
                  unless csrf_token
                    Rails.logger.error("Failed to obtain CSRF token after token refresh")
                    raise "Failed to obtain CSRF token from TOOL2"
                  end
                  
                  # Retry data request with new token
                  data_request['Authorization'] = "Bearer #{jwt}"
                  data_request['X-CSRF-Token'] = csrf_token
                  data_request['Cookie'] = csrf_cookies if csrf_cookies
                  data_response = data_http.request(data_request)
                  
                  unless data_response.code == '200'
                    Rails.logger.error("TOOL2 API error after token refresh - Status: #{data_response.code}, Body: #{data_response.body[0..500]}")
                    raise "TOOL2 returned status #{data_response.code}"
                  end
                else
                  Rails.logger.error("Token refresh failed")
                  raise "Authentication failed - please log in again"
                end
              else
                Rails.logger.error("No refresh token available")
                raise "Authentication expired - please log in again"
              end
            else
              Rails.logger.error("TOOL2 API error - Status: #{data_response.code}, Body: #{data_response.body[0..500]}")
              raise "TOOL2 returned status #{data_response.code}"
            end
          end

          # Parse data from TOOL2
          data = JSON.parse(data_response.body)
          
          {
            csrf_token: csrf_token,
            cookies: csrf_cookies,
            data: data
          }
        end

        def reconstruct_token_from_cookies(cookies_hash, token_key)
          return nil unless cookies_hash
          
          chunk_count = cookies_hash["#{token_key}_count"].to_i
          return nil if chunk_count.zero?
          
          chunks = []
          chunk_count.times do |i|
            chunk = cookies_hash["#{token_key}_#{i}"]
            if chunk
              chunks << chunk
            else
              break
            end
          end
          
          return nil if chunks.length != chunk_count
          chunks.join
        rescue => e
          Rails.logger.debug "Error reconstructing token: #{e.message}"
          nil
        end
      end
    end
  end
end

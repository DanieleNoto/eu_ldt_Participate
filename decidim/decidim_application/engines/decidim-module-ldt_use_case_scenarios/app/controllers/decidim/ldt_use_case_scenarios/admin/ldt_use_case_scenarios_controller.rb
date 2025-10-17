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

        # Proxy endpoint to fetch experiments from the external TOOL2 API.
        # It performs server-side handshake (csrf-token) and forwards the experiments JSON.
        def external_experiments
          begin
            # Get JWT token from local endpoint using Net::HTTP instead of shell command
            jwt_url = "#{request.protocol}#{request.host_with_port}/api/jwt_token"
            uri = URI(jwt_url)
            http = Net::HTTP.new(uri.host, uri.port)
            http.use_ssl = uri.scheme == 'https'
            
            request_obj = Net::HTTP::Get.new(uri)
            request_obj['Accept'] = 'application/json'
            
            jwt_response = http.request(request_obj).body
            jwt_json = JSON.parse(jwt_response) rescue {}
            jwt = jwt_json["token"]
            
            unless jwt
              return render json: { error: "failed to obtain jwt" }, status: :bad_gateway
            end

            page = params[:page] || 0
            size = params[:size] || 100

            # Configure TOOL2 API URLs
            base_url = (ENV["TOOL2_EXPERIMENTS_URL"] || "https://ucs-int.ldttoolbox.app/api/v1/experiments").sub(/\/experiments$/, "")
            csrf_url = "#{base_url}/csrf-token"
            experiments_url = "#{base_url}/experiments"

            # Step 1: Get CSRF token using Net::HTTP
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
            
            # Extract cookies from CSRF response for subsequent requests
            csrf_cookies = csrf_response_obj['Set-Cookie']

            unless csrf_token
              if ENV["TOOL2_MOCK_MODE"] == "true"
                return render json: {
                  content: [
                    { id: 1, name: "Experiment 1", description: "Mock experiment 1" },
                    { id: 2, name: "Experiment 2", description: "Mock experiment 2" },
                    { id: 3, name: "Experiment 3", description: "Mock experiment 3" }
                  ]
                }
              end
              return render json: { error: "failed to obtain csrf token" }, status: :bad_gateway
            end

            # Step 2: Fetch experiments with CSRF token
            # Sanitize page and size parameters to prevent command injection
            page = Integer(params[:page] || 0) rescue 0
            size = Integer(params[:size] || 100) rescue 100
            
            ex_uri = URI("#{experiments_url}?page=#{page}&size=#{size}")
            ex_http = Net::HTTP.new(ex_uri.host, ex_uri.port)
            ex_http.use_ssl = ex_uri.scheme == 'https'
            
            ex_request = Net::HTTP::Get.new(ex_uri)
            ex_request['Authorization'] = "Bearer #{jwt}"
            ex_request['X-CSRF-Token'] = csrf_token
            # Include CSRF cookies if available
            ex_request['Cookie'] = csrf_cookies if csrf_cookies
            ex_request['Accept'] = 'application/json'
            
            ex_response = ex_http.request(ex_request).body

            # Check if response is HTML
            if ex_response.strip.start_with?('<!DOCTYPE', '<!doctype', '<html')
              return render json: { error: "TOOL2 returned HTML - wrong endpoint or authentication issue" }, status: :bad_gateway
            end

            # Parse and return experiments
            result = JSON.parse(ex_response)
            render json: result
          rescue JSON::ParserError => e
            render json: { error: "parsing error: #{e.message}" }, status: :unprocessable_entity
          rescue => e
            render json: { error: "unexpected error: #{e.message}" }, status: :internal_server_error
          end
        end

        def new
          # Form is handled client-side with JavaScript
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
            redirect_to "/admin/participatory_processes/#{params[:participatory_process_slug]}/components/#{params[:component_id]}/manage/ldt_use_case_scenarios", alert: t("decidim.admin.actions.not_allowed")
            return
          end

          @scenario = collection.find_by(id: params[:id])

          unless @scenario
            redirect_to "/admin/participatory_processes/#{params[:participatory_process_slug]}/components/#{params[:component_id]}/manage/ldt_use_case_scenarios", alert: t("decidim.admin.actions.not_found")
            return
          end

          if @scenario.destroy
            redirect_to "/admin/participatory_processes/#{params[:participatory_process_slug]}/components/#{params[:component_id]}/manage/ldt_use_case_scenarios", notice: t("decidim.admin.actions.deleted")
          else
            redirect_to "/admin/participatory_processes/#{params[:participatory_process_slug]}/components/#{params[:component_id]}/manage/ldt_use_case_scenarios", alert: @scenario.errors.full_messages.to_sentence
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
      end
    end
  end
end

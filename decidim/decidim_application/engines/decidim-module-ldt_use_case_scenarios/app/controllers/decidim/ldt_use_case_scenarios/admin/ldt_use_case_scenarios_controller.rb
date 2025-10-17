# frozen_string_literal: true

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
            # Get JWT token from local endpoint using curl
            jwt_url = "#{request.protocol}#{request.host_with_port}/api/jwt_token"
            jwt_cmd = "curl -s '#{jwt_url}' -H 'Accept: application/json'"
            jwt_response = `#{jwt_cmd}`
            
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
            cookie_jar = "/tmp/tool2_cookies_#{SecureRandom.hex(8)}.txt"

            # Step 1: Get CSRF token
            csrf_cmd = "curl -s -X GET '#{csrf_url}' " \
                       "-H 'Authorization: Bearer #{jwt}' " \
                       "-H 'Accept: application/json' " \
                       "-c #{cookie_jar}"

            csrf_response = `#{csrf_cmd}`
            csrf_json = JSON.parse(csrf_response) rescue {}
            csrf_token = csrf_json["csrfToken"]

            unless csrf_token
              File.delete(cookie_jar) if File.exist?(cookie_jar)
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
            ex_cmd = "curl -s -X GET '#{experiments_url}?page=#{page}&size=#{size}' " \
                     "-H 'Authorization: Bearer #{jwt}' " \
                     "-H 'X-CSRF-Token: #{csrf_token}' " \
                     "-H 'Accept: application/json' " \
                     "-b #{cookie_jar}"

            ex_response = `#{ex_cmd}`

            # Check if response is HTML
            if ex_response.strip.start_with?('<!DOCTYPE', '<!doctype', '<html')
              File.delete(cookie_jar) if File.exist?(cookie_jar)
              return render json: { error: "TOOL2 returned HTML - wrong endpoint or authentication issue" }, status: :bad_gateway
            end

            # Parse and return experiments
            result = JSON.parse(ex_response)
            File.delete(cookie_jar) if File.exist?(cookie_jar)
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
          # Handle deletion
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

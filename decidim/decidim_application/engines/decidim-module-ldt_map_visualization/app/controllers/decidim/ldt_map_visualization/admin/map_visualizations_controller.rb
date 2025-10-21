# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Decidim
  module LdtMapVisualization
    module Admin
      # Admin controller for managing map visualizations with proxy to external TOOL1 API
      class MapVisualizationsController < Decidim::Admin::Components::BaseController
        def index
          @map_visualizations = collection
        end

        def debug_token
          render json: {
            cookies_keys: request.cookies.keys.grep(/keycloak/),
            access_token_count: request.cookies['keycloak_access_token_count'],
            refresh_token_count: request.cookies['keycloak_refresh_token_count'],
            session_keys: session.keys.grep(/jwt|token|keycloak/)
          }
        end

        def new
          @form = ::Decidim::LdtMapVisualization::MapVisualizationForm.new
          
          # Fetch maps from TOOL1 when rendering the form
          begin
            # Get token from cookies (this is the user's actual Keycloak token from browser login)
            access_token = get_jwt_token
            
            if access_token.blank?
              Rails.logger.warn("No Keycloak access token in cookies for user #{current_user&.id}")
              @maps = []
              @maps_error = "No valid authentication token. Please log in again or refresh the page."
              return
            end

            Rails.logger.info("Using access token (#{access_token.length} chars) for user #{current_user&.id}")
            
            # Debug: log token payload
            begin
              payload_part = access_token.split('.')[1]
              if payload_part
                decoded_payload = Base64.decode64(payload_part.ljust((payload_part.length + 3) / 4 * 4, '='))
                token_data = JSON.parse(decoded_payload) rescue {}
              end
            rescue => e
              
            end

            # Fetch maps from TOOL1
            maps_url = ENV['TOOL1_MAPS_URL'] || 'https://maps-int.ldttoolbox.app/api/v1/maps'

            # Try to exchange the token for TOOL1 audience/client if possible
            begin
              exchanged = Decidim::Keycloak::TokenService.new.exchange_token_for_audience(access_token, ENV['TOOL1_CLIENT_ID'] || 'tool1')
              if exchanged.present?
                token_to_use = exchanged
              else       
                token_to_use = access_token
              end
            rescue => e
              Rails.logger.warn("Token exchange attempt raised: #{e.class} - #{e.message}; falling back to original token")
              token_to_use = access_token
            end

            # Use the chosen token to fetch maps
            result = fetch_from_tool1(token_to_use, maps_url)

            # Parse maps data
            @maps = parse_maps_response(result)
            
            @maps_error = nil
            
          rescue => e
            Rails.logger.error("Error fetching maps: #{e.class} - #{e.message}")
            Rails.logger.error(e.backtrace.first(3).join("\n"))
            @maps = []
            @maps_error = "Error loading maps: #{e.message}"
          end
        end

        def create
          begin
            map_id = params.dig(:map_visualization, :map_id)
            map_name = params.dig(:map_visualization, :name)
            map_data = params.dig(:map_visualization, :map_data)
            
            # Validate params
            unless map_id.present? && map_name.present?
              flash[:alert] = I18n.t("map_visualizations.create.error", scope: "decidim.ldt_map_visualization.admin")
              redirect_to new_map_visualization_path
              return
            end

            # Ensure map_data is stored as JSON string
            # If it's already a string, keep it; if it's a Hash, convert to JSON
            json_map_data = if map_data.is_a?(String)
              # Validate it's valid JSON
              JSON.parse(map_data) # This will raise if invalid
              map_data # Keep the original string
            elsif map_data.is_a?(Hash)
              map_data.to_json
            else
              {}.to_json
            end

            # Create new map visualization
            @map_visualization = Decidim::LdtMapVisualization::MapVisualization.new(
              name: map_name,
              map_id: map_id,
              map_data: json_map_data,
              decidim_component_id: current_component.id
            )

            if @map_visualization.save
              
              flash[:notice] = I18n.t("map_visualizations.create.success", scope: "decidim.ldt_map_visualization.admin")
              redirect_to map_visualizations_path
            else
              Rails.logger.error("Failed to save map visualization: #{@map_visualization.errors.full_messages.join(', ')}")
              flash[:alert] = I18n.t("map_visualizations.create.error", scope: "decidim.ldt_map_visualization.admin")
              redirect_to new_map_visualization_path
            end
          rescue ActiveRecord::RecordNotUnique => e
            Rails.logger.error("Duplicate map: #{e.message}")
            flash[:alert] = "This map has already been added to this component."
            redirect_to map_visualizations_path
          rescue JSON::ParserError => e
            Rails.logger.error("JSON parsing error: #{e.message}")
            flash[:alert] = "Error parsing map data: #{e.message}"
            redirect_to new_map_visualization_path
          rescue => e
            Rails.logger.error("Unexpected error in create: #{e.class} - #{e.message}")
            flash[:alert] = "Unexpected error: #{e.message}"
            redirect_to new_map_visualization_path
          end
        end

        def edit
          @map_visualization = collection.find(params[:id])
          @form = ::Decidim::LdtMapVisualization::MapVisualizationForm.from_model(@map_visualization)
        end

        def update
          @map_visualization = collection.find(params[:id])
          @form = ::Decidim::LdtMapVisualization::MapVisualizationForm.from_params(params)

          ::Decidim::LdtMapVisualization::UpdateMapVisualization.call(@form, @map_visualization) do
            on(:ok) do
              flash[:notice] = I18n.t("map_visualizations.update.success", scope: "decidim.ldt_map_visualization.admin")
              redirect_to map_visualizations_path
            end

            on(:invalid) do
              flash.now[:alert] = I18n.t("map_visualizations.update.error", scope: "decidim.ldt_map_visualization.admin")
              render :edit
            end
          end
        end

        def destroy
          @map_visualization = collection.find_by(id: params[:id])

          unless @map_visualization
            flash[:alert] = I18n.t("map_visualizations.destroy.not_found", scope: "decidim.ldt_map_visualization.admin")
            redirect_to map_visualizations_path
            return
          end

          if @map_visualization.destroy
            flash[:notice] = I18n.t("map_visualizations.destroy.success", scope: "decidim.ldt_map_visualization.admin")
          else
            flash[:alert] = @map_visualization.errors.full_messages.to_sentence
          end

          redirect_to map_visualizations_path
        end
        
        private
        
        def get_jwt_token
          # Use Keycloak TokenService to get a fresh token, with automatic refresh if needed
          jwt = Decidim::Keycloak::TokenService.ensure_valid_token(current_user, request.cookies, cookies)
          return jwt if jwt.present?
          
          # Fallback: try to get JWT token from cookies directly (stored as chunks during OAuth login)
          access_token = reconstruct_token_from_cookies(cookies, 'keycloak_access_token')
          return access_token if access_token.present?
          
          # Try session as last resort
          session_token = session['jwt_token'] || session['id_token'] || session['access_token']
          return session_token if session_token.present?
          
          nil
        end
        
        def reconstruct_token_from_cookies(cookies_obj, token_key)
          return nil unless cookies_obj
          
          chunk_count = cookies_obj["#{token_key}_count"].to_i
          return nil if chunk_count.zero?
          
          Rails.logger.debug "Reconstructing #{token_key} from #{chunk_count} chunks"
          
          chunks = []
          chunk_count.times do |i|
            chunk = cookies_obj["#{token_key}_#{i}"]
            if chunk
              Rails.logger.debug "  Chunk #{i}: found (#{chunk.length} bytes)"
              chunks << chunk
            else
              Rails.logger.debug "  Chunk #{i}: NOT FOUND"
              break
            end
          end
          
          if chunks.length != chunk_count
            Rails.logger.debug "Could not reconstruct #{token_key}: expected #{chunk_count} chunks, got #{chunks.length}"
            return nil
          end
          
          reconstructed = chunks.join
          Rails.logger.debug "Reconstructed #{token_key} (#{reconstructed.length} bytes)"
          reconstructed
        rescue => e
          Rails.logger.debug "Error reconstructing token: #{e.message}"
          nil
        end

        def collection
          @collection ||= Decidim::LdtMapVisualization::MapVisualization
                            .where(component: current_component)
                            .order(created_at: :desc)
        end
        
        def parse_maps_response(result)
          if result.is_a?(Array)
            result
          elsif result.is_a?(Hash) && result['content'].is_a?(Array)
            result['content']
          elsif result.is_a?(Hash) && result['maps'].is_a?(Array)
            result['maps']
          else
            []
          end
        end

        # Helper method to fetch maps from TOOL1 API
        # Pass token as cookie parameter, not as Bearer authorization
        def fetch_from_tool1(jwt, maps_url)
          # Fetching maps from TOOL1 using Cookie for auth
          Rails.logger.info("Fetching maps from TOOL1: #{maps_url} with token in Cookie")
          uri = URI(maps_url)
          
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == 'https'
          http.read_timeout = 10
          http.open_timeout = 10
          
          # Initialize GET request with headers including Cookie, Authorization, and User-Agent to mimic curl
          # headers = {
          #   'Accept' => 'application/json',
          #   'Content-Type' => 'application/json',
          #   'Cookie' => "access_token=#{jwt}",
          #   'Authorization' => "Bearer #{jwt}",
          #   'Host' => uri.host
          # }
          headers = {
            'Accept' => '*/*',
            'Authorization' => "Bearer #{jwt}",
            # Send cookie for the target host; do not hardcode Host header
            'Cookie' => "access_token=#{jwt}",
            'User-Agent' => 'curl/8.5.0',
            'Host' => uri.host
          }
          # Use full URI for proper Host header and cookie domain handling
          request = Net::HTTP::Get.new(uri, headers)
          Rails.logger.info("Sending request to TOOL1 (#{uri.host}) with access_token in Cookie and Authorization Bearer token")
          Rails.logger.debug("Cookie header: #{request['Cookie'][0..200] rescue request['Cookie']}")
          Rails.logger.debug("Request headers: #{request.to_hash.inspect}")
          
          response = http.request(request)

          # Mask sensitive header values for logs
          def mask_header_value(val)
            return nil unless val
            if val.length > 40
              "<redacted>" + val[-8..-1]
            else
              "<redacted>"
            end
          end

          # Log status and headers (mask Authorization and Cookie)
          logged_headers = response.to_hash.transform_values do |vals|
            vals.map do |v|
              if v =~ /Bearer\s+/i || v.include?('access_token')
                mask_header_value(v)
              else
                v
              end
            end
          end

          Rails.logger.info("TOOL1 response status: #{response.code}")
          Rails.logger.debug("TOOL1 response headers: #{logged_headers.inspect}")

          # Truncate and try to pretty-print JSON body for readability
          raw_body = response.body.to_s
          truncated = raw_body.length > 10_000 ? raw_body[0..9_999] + "...<truncated>" : raw_body
          begin
            parsed = JSON.parse(raw_body)
            pretty = JSON.pretty_generate(parsed)
            pretty = pretty[0..9_999] + "...<truncated>" if pretty.length > 10_000
            Rails.logger.debug("TOOL1 response body (json, truncated): #{pretty}")
          rescue JSON::ParserError
            Rails.logger.debug("TOOL1 response body (raw, truncated): #{truncated}")
          end

          unless response.code == '200'
            # If unauthorized (401), try refreshing token and retry once
            if response.code == '401'
              Rails.logger.warn("TOOL1 API returned 401 - attempting token refresh and retry")
              
              # Force token refresh
              refresh_token = reconstruct_token_from_cookies(request.cookies, 'keycloak_refresh_token')
              if refresh_token.present?
                new_tokens = Decidim::Keycloak::TokenService.new.send(:refresh_access_token, refresh_token)
                
                if new_tokens
                  # Save new tokens and retry request
                  Decidim::Keycloak::TokenService.new.save_tokens_to_cookies(cookies, new_tokens)
                  jwt = new_tokens[:access_token]
                  
                  # Retry the request with new token
                  request['Authorization'] = "Bearer #{jwt}"
                  request['Cookie'] = "access_token=#{jwt}"
                  response = http.request(request)
                  
                  unless response.code == '200'
                    error_body = response.body.to_s[0..500]
                    Rails.logger.error("TOOL1 API error after token refresh - Status: #{response.code}, Body: #{error_body}")
                    raise "TOOL1 returned status #{response.code}: #{error_body}"
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
              error_body = truncated[0..500]
              Rails.logger.error("TOOL1 API error - Status: #{response.code}, Body: #{error_body}")
              raise "TOOL1 returned status #{response.code}: #{error_body}"
            end
          end

          # Parse and return data
          data = JSON.parse(response.body)
          Rails.logger.info("Successfully fetched data from TOOL1 (#{data.class})")

          data
        end
      end
    end
  end
end

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

require "net/http"
require "uri"
require "json"

module Decidim
  module LdtMapVisualization
    module Admin
      # Admin controller for managing map visualizations with proxy to external TOOL1 API
      class MapVisualizationsController < ApplicationController
        def index
          @map_visualizations = collection.page(params[:page])
        end

        def debug_token
          render json: {
            cookies_keys: request.cookies.keys.grep(/token/),
            access_token_present: request.cookies["access_token"].present?,
            refresh_token_present: request.cookies["refresh_token"].present?,
            id_token_present: request.cookies["id_token"].present?,
            session_keys: session.keys.grep(/jwt|token|keycloak/)
          }
        end

        # Proxy endpoint for AJAX pagination of maps from TOOL1 (public API, no auth required).
        def external_maps
          page = begin
            Integer(params[:page] || 0)
          rescue StandardError
            0
          end
          page_size = begin
            [Integer(params[:pageSize] || 20), 50].min
          rescue StandardError
            20
          end

          maps_url = ENV["TOOL1_MAPS_URL"] || "https://maps-int.ldttoolbox.app/api/v1/maps"
          result = fetch_from_tool1("#{maps_url}?page=#{page}&pageSize=#{page_size}")
          maps = parse_maps_response(result)
          pagination = result.is_a?(Hash) ? (result["pagination"] || {}) : {}
          total_pages = pagination["totalPages"].to_i
          has_more = total_pages > 1 ? (page + 1) < total_pages : maps.length >= page_size

          render json: { maps: maps, hasMore: has_more, page: page, pageSize: page_size, totalPages: total_pages }
        rescue JSON::ParserError => e
          Rails.logger.error("JSON parsing error in external_maps: #{e.message}")
          render json: { error: "Parsing error: #{e.message}" }, status: :unprocessable_entity
        rescue StandardError => e
          Rails.logger.error("Unexpected error in external_maps: #{e.message}")
          render json: { error: e.message }, status: :internal_server_error
        end

        def new
          @form = ::Decidim::LdtMapVisualization::MapVisualizationForm.new
          fetch_maps_for_form
        end

        def edit
          @map_visualization = collection.find(params[:id])
          @form = ::Decidim::LdtMapVisualization::MapVisualizationForm.from_model(@map_visualization)
        end

        def create
          @form = ::Decidim::LdtMapVisualization::MapVisualizationForm.from_params(params)

          if @form.invalid?
            # Re-fetch maps for the form
            fetch_maps_for_form
            render :new
            return
          end

          begin
            map_id = @form.map_id
            map_name = @form.name
            map_data = @form.map_data

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
              description: @form.description.to_s.strip.presence,
              decidim_component_id: current_component.id
            )

            if @map_visualization.save
              flash[:notice] = I18n.t("map_visualizations.create.success", scope: "decidim.ldt_map_visualization.admin")
              redirect_to map_visualizations_path
            else
              flash[:alert] = I18n.t("map_visualizations.create.error", scope: "decidim.ldt_map_visualization.admin")
              redirect_to new_map_visualization_path
            end
          rescue ActiveRecord::RecordNotUnique
            flash[:alert] = I18n.t("create.duplicate_map", scope: "decidim.ldt_map_visualization.admin")
            redirect_to map_visualizations_path
          rescue JSON::ParserError => e
            flash[:alert] = "Error parsing map data: #{e.message}"
            redirect_to new_map_visualization_path
          rescue StandardError => e
            flash[:alert] = "Unexpected error: #{e.message}"
            redirect_to new_map_visualization_path
          end
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

        def collection
          @collection ||= Decidim::LdtMapVisualization::MapVisualization
                          .where(component: current_component)
                          .order(created_at: :desc)
        end

        def parse_maps_response(result)
          if result.is_a?(Array)
            result
          elsif result.is_a?(Hash)
            (result["data"] || result["content"] || result["maps"] || result["items"] || result["results"] || []).then do |maps|
              maps.is_a?(Array) ? maps : []
            end
          else
            []
          end
        end

        def fetch_from_tool1(maps_url)
          Rails.logger.info("Fetching maps from TOOL1: #{maps_url}")
          uri = URI(maps_url)

          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = uri.scheme == "https"
          http.read_timeout = 10
          http.open_timeout = 10

          request = Net::HTTP::Get.new(uri, { "Accept" => "*/*", "User-Agent" => "curl/8.5.0" })
          Rails.logger.info("Sending request to TOOL1 (#{uri.host}) - public API, no auth")

          response = http.request(request)
          Rails.logger.info("TOOL1 response status: #{response.code}")

          return JSON.parse(response.body) if response.code == "200"

          error_body = response.body.to_s[0..500]
          Rails.logger.error("TOOL1 API error - Status: #{response.code}")
          raise "TOOL1 returned status #{response.code}: #{error_body}"
        end

        def fetch_maps_for_form
          maps_url = ENV["TOOL1_MAPS_URL"] || "https://maps-int.ldttoolbox.app/api/v1/maps"
          @page_size = 20

          result = fetch_from_tool1("#{maps_url}?page=0&pageSize=#{@page_size}")
          @maps = parse_maps_response(result)
          pagination = result.is_a?(Hash) ? (result["pagination"] || {}) : {}
          total_pages = pagination["totalPages"].to_i
          @has_more = total_pages > 1 ? 1 < total_pages : @maps.length >= @page_size
          @maps_error = nil
        rescue StandardError => e
          Rails.logger.error("Error fetching maps: #{e.class} - #{e.message}")
          Rails.logger.error(e.backtrace.first(3).join("\n"))
          @maps = []
          @maps_error = "Error loading maps: #{e.message}"
        end
      end
    end
  end
end

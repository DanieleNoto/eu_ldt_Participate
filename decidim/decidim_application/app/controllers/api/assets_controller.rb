# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

module Api
  class AssetsController < ApplicationController
    before_action :set_asset, only: [:show]

    # GET /api/assets
    def index
      collector = AssetCollector.new(current_organization)
      @assets = collector.collect_all

      # Apply filters if provided
      apply_filters if params[:filters].present?

      # Apply pagination only if explicitly requested
      if params[:page].present? || params[:per_page].present?
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 25).to_i.clamp(1, 100) # Max 100 per page
        offset = (page - 1) * per_page

        total_count = @assets.size
        paginated_assets = @assets[offset, per_page] || []

        render json: {
          data: AssetFormatter.format_assets(paginated_assets),
          meta: {
            page: page,
            per_page: per_page,
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil
          }
        }
      else
        # Return all assets without pagination
        render json: {
          data: AssetFormatter.format_assets(@assets),
          meta: {
            total_count: @assets.size,
            paginated: false
          }
        }
      end
    rescue ArgumentError => e
      render json: { error: e.message }, status: :bad_request
    rescue StandardError => e
      Rails.logger.error "Error in assets index: #{e.message}\n#{e.backtrace.join("\n")}"
      render json: { error: "Internal server error" }, status: :internal_server_error
    end

    # GET /api/assets/:id
    def show
      render json: @asset
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Asset not found" }, status: :not_found
    rescue StandardError => e
      Rails.logger.error "Error in assets show: #{e.message}\n#{e.backtrace.join("\n")}"
      render json: { error: "Internal server error" }, status: :internal_server_error
    end

    private

    def current_organization
      @current_organization ||= Decidim::Organization.find_by(host: request.host)
    end

    def set_asset
      raise ActiveRecord::RecordNotFound unless current_organization

      @asset = AssetFormatter.find_asset_by_composite_id(params[:id], current_organization)
      raise ActiveRecord::RecordNotFound unless @asset
    end

    def apply_filters
      # TODO: Implement filtering logic
    end
  end
end

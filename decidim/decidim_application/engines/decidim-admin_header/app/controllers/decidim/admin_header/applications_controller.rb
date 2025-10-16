# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

module Decidim
  module AdminHeader
    class ApplicationsController < Decidim::Admin::ApplicationController
      def tool0_config
        # Return Tool0 API configuration for frontend
        config = {
          tool0Url: ENV['TOOL0_FULL_URL'] || 'https://ie-int.ldttoolbox.app/api/dashboard/applications/external-tools'
        }
        
        render json: config
      end

    end
  end
end
# SPDX-License-Identifier: EUPL-1.2
# Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
# See: https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12
#
# Authors:
# - Gianfranco Cedro

# frozen_string_literal: true

Rails.application.config.to_prepare do
  # Add after_action to ApplicationController to delete stale cookies
  # This works in conjunction with CookieCleanupMiddleware
  ApplicationController.class_eval do
    after_action :cleanup_stale_cookies

    private

    def cleanup_stale_cookies
      return unless request.env['decidim.cookies_to_delete']
      
      request.env['decidim.cookies_to_delete'].each do |cookie_name|
        cookies.delete(cookie_name, domain: :all)
      end
    end
  end
end

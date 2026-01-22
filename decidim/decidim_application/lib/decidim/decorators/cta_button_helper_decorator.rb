# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Decorator to fix XSS vulnerability in CTA button text rendering
# This decorator sanitizes the CTA button text to prevent stored XSS attacks
# by ensuring proper HTML escaping of user-provided input from organization settings
module Decidim
  module CtaButtonHelperDecorator
    # Override the cta_button_text method to sanitize the output
    # preventing XSS attacks through stored malicious scripts in the
    # organization's cta_button_text field
    def cta_button_text
      # Get the translated attribute value
      text = translated_attribute(current_organization.cta_button_text).presence
      
      # Sanitize the text by HTML escaping it to prevent XSS
      # This ensures that any HTML/JavaScript injected by an admin cannot be executed
      text = ERB::Util.html_escape(text) if text.present?
      
      # Return sanitized text or fallback to default translation
      text || t("decidim.pages.home.hero.participate")
    end
  end
end

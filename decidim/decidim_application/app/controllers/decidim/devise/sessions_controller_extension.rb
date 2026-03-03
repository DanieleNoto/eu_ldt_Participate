# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

module Decidim
  module Devise
    # Extension for SessionsController to implement Keycloak Single Logout (SLO)
    module SessionsControllerExtension
      extend ActiveSupport::Concern

      # Override destroy to implement Single Logout with Keycloak
      def destroy
        # Check if user is authenticated via Keycloak
        should_logout_from_keycloak = session[:keycloak_authenticated].present? && current_user.present?
        keycloak_logout_url = build_keycloak_logout_url if should_logout_from_keycloak

        # Save cookie consent state before session is destroyed
        consent_state = session["cookie_consent"] || session["decidim_cookie_consent"]

        # Clear Keycloak tokens — cookie absence prevents background auto-login loop
        Decidim::Keycloak::CookieManager.clear_all_cookies(cookies, request.host, session)

        # Perform standard Devise logout
        signed_out = (::Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
        set_flash_message! :notice, :signed_out if signed_out

        # Restore cookie consent state to prevent banner reappearing
        if consent_state.present?
          session["cookie_consent"] = consent_state
          session["decidim_cookie_consent"] = consent_state
        end

        yield if block_given?

        # Redirect to Keycloak logout or local path
        if should_logout_from_keycloak && keycloak_logout_url.present?
          redirect_to keycloak_logout_url, allow_other_host: true
        else
          redirect_to after_sign_out_path_for(resource_name)
        end
      end

      private

      # Returns true if the id_token's azp (authorized party) matches the given client_id.
      # Keycloak 18+ rejects id_token_hint when azp != client_id in the logout request.
      def id_token_issued_for?(id_token, client_id)
        payload_b64 = id_token.split(".")[1]
        return false if payload_b64.blank?

        claims = JSON.parse(Base64.decode64(payload_b64 + "=="))
        token_client = claims["azp"] || Array(claims["aud"]).first
        token_client == client_id
      rescue StandardError => e
        Rails.logger.warn "[Keycloak Logout] Could not decode id_token to check azp: #{e.message}"
        false
      end

      def build_keycloak_logout_url
        keycloak_site = ENV.fetch("OMNIAUTH_KEYCLOAK_SITE", nil)
        realm = ENV.fetch("OMNIAUTH_KEYCLOAK_REALM", nil)

        return nil unless keycloak_site.present? && realm.present?

        # Build the redirect URI (where to return after Keycloak logout)
        # Use root_path without any query parameters to avoid "invalid redirect URI" errors
        redirect_uri = if request.present?
                         base_url = "#{request.protocol}#{request.host_with_port}"
                         # Always use clean root path without locale or other parameters
                         "#{base_url}/"
                       else
                         # Fallback: construct from organization host
                         org_host = current_organization&.host || request.host
                         protocol = Rails.env.production? ? "https://" : "http://"
                         "#{protocol}#{org_host}/"
                       end

        # Get id_token from cookies for automatic logout
        id_token = cookies["id_token"]
        client_id = ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_ID", nil)

        # Keycloak logout endpoint — always include client_id so Keycloak validates
        # post_logout_redirect_uri against THIS client's registered URIs, not against
        # the azp in the id_token (which may belong to a different SSO tool).
        keycloak_logout_path = "/realms/#{realm}/protocol/openid-connect/logout"
        logout_url = "#{keycloak_site.chomp("/")}#{keycloak_logout_path}?" \
                     "client_id=#{CGI.escape(client_id)}" \
                     "&post_logout_redirect_uri=#{CGI.escape(redirect_uri)}"

        # Add id_token_hint only if the token was issued for THIS client.
        # Cross-tool SSO may leave an id_token from a different client (e.g. tool2) in the
        # shared-domain cookie. Keycloak 18+ rejects id_token_hint when azp != client_id.
        if id_token.present? && id_token_issued_for?(id_token, client_id)
          logout_url += "&id_token_hint=#{CGI.escape(id_token)}"
          Rails.logger.info "✓ Using id_token_hint for automatic Keycloak logout"
        elsif id_token.present?
          Rails.logger.warn "✗ id_token belongs to a different client — omitting id_token_hint to avoid Keycloak error"
        else
          Rails.logger.warn "✗ No id_token found in cookies, Keycloak may show confirmation page"
        end

        Rails.logger.info "[Keycloak Logout] Built logout URL with redirect_uri: #{redirect_uri}"
        logout_url
      rescue StandardError => e
        Rails.logger.error "Error building Keycloak logout URL: #{e.message}"
        nil
      end
    end
  end
end

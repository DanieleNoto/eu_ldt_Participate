# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

require "jwt"

module Decidim
  module Meetings
    module Jitsi
      # Service to generate JWT tokens for Jitsi meetings with moderator privileges
      class JwtTokenGenerator
        # Public: Initializes the service.
        #
        # user - The Decidim::User who will join the meeting
        # meeting - The Decidim::Meeting instance
        # room_name - The Jitsi room name (optional, will be extracted from meeting if not provided)
        def initialize(user:, meeting:, room_name: nil)
          @user = user
          @meeting = meeting
          @room_name = room_name || extract_room_name
        end

        # Public: Generates a JWT token with moderator privileges
        #
        # Returns a String with the JWT token
        def generate
          payload = {
            # Standard JWT claims
            iss: issuer,
            aud: audience,
            sub: @meeting.component.participatory_space.slug,
            room: @room_name,
            exp: expiration_time,
            nbf: Time.now.to_i,
            iat: Time.now.to_i,

            # Jitsi-specific claims
            context: {
              user: {
                id: @user.id.to_s,
                name: @user.name,
                email: @user.email,
                avatar: avatar_url,
                moderator: "true"
              },
              group: @meeting.component.participatory_space.title[@meeting.organization.default_locale] || @meeting.component.participatory_space.title.values.first,
              features: ["recording": "true"]
            },

            # Moderator flag (critical for admin privileges)
            moderator: true
          }

          # Jitsi requires "typ": "JWT" in the header
          headers = { typ: "JWT" }

          JWT.encode(payload, jwt_secret, "HS256", headers)
        end

        private

        # Extract room name from meeting URL or generate it
        def extract_room_name
          # If meeting has an online_meeting_url, try to extract the room name
          if @meeting.online_meeting_url.present?
            uri = URI.parse(@meeting.online_meeting_url)
            # Jitsi room name is typically the last part of the path
            room_from_url = uri.path.split("/").last
            return room_from_url if room_from_url.present?
          end

          # Fallback: generate room name from meeting ID
          "#{room_prefix}#{@meeting.id}"
        end

        def issuer
          # Use Keycloak realm URL as issuer
          keycloak_site = ENV.fetch("OMNIAUTH_KEYCLOAK_SITE", "https://im-int.ldttoolbox.app/")
          keycloak_realm = ENV.fetch("OMNIAUTH_KEYCLOAK_REALM", "LDT")
          "#{keycloak_site.gsub(%r{/$}, "")}/realms/#{keycloak_realm}"
        end

        def audience
          ENV.fetch("JWT_APP_ID", ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_ID", "tool3"))
        end

        def jwt_secret
          # JWT secret is the same as Keycloak client secret
          ENV.fetch("JWT_APP_SECRET", ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_SECRET", ""))
        end

        def room_prefix
          @meeting.component.settings.jitsi_room_prefix || Constants::JITSI_DEFAULT_ROOM_PREFIX
        end

        def expiration_time
          # Token valid for 24 hours
          24.hours.from_now.to_i
        end

        def avatar_url
          return "" unless @user.avatar.attached?

          # Try to get the avatar URL
          if @user.avatar.respond_to?(:url)
            Rails.application.routes.url_helpers.rails_blob_url(@user.avatar, host: @meeting.organization.host)
          else
            ""
          end
        rescue StandardError
          ""
        end
      end
    end
  end
end

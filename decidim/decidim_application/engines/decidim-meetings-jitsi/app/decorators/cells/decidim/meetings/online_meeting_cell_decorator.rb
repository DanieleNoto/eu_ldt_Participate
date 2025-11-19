# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# This decorator extends the Decidim::Meetings::OnlineMeetingCell
# to pass user and meeting information to MeetingIframeEmbedder for JWT token generation

# frozen_string_literal: true

Rails.logger.info("=== Loading OnlineMeetingCell Decorator ===")

Decidim::Meetings::OnlineMeetingCell.class_eval do
  # Override embedder to pass user and meeting for JWT token generation
  def embedder
    @embedder ||= begin
      # In Decidim cells, current_user is accessed via controller
      user = controller.try(:current_user)

      Decidim::Meetings::MeetingIframeEmbedder.new(
        model.online_meeting_url,
        user: user,
        meeting: model
      )
    end
  end

  # Override live_event_url to add JWT token for Jitsi admin users
  def live_event_url
    if embeddable?
      Decidim::EngineRouter.main_proxy(model.component).meeting_live_event_path(meeting_id: model.id)
    else
      # For non-embeddable URLs (direct Jitsi links), check if we need to add JWT token
      user = controller.try(:current_user)

      # Check if it's a Jitsi URL and user is admin
      if user && model && jitsi_url? && user_is_admin?(user)
        Rails.logger.info("Adding JWT token to live event URL for admin user")
        add_jwt_to_jitsi_url(model.online_meeting_url, user)
      else
        Rails.logger.info("Live event URL without JWT: embeddable=#{embeddable?}, user=#{user.present?}, jitsi=#{jitsi_url?}")
        model.online_meeting_url
      end
    end
  end

  private

  # Check if the URL is a Jitsi URL based on configured Jitsi servers
  def jitsi_url?
    return false unless model&.component&.settings

    jitsi_server = model.component.settings.jitsi_server_url
    return false if jitsi_server.blank?

    # Normalize URLs for comparison
    jitsi_host = URI.parse(jitsi_server).host
    meeting_host = URI.parse(model.online_meeting_url).host

    jitsi_host == meeting_host
  rescue URI::InvalidURIError => e
    Rails.logger.error("Invalid URI in live_event_url: #{e.message}")
    false
  end

  # Check if the user is an admin of the meeting
  def user_is_admin?(user)
    return false unless user && model

    is_space_admin = model.component.participatory_space.admins.include?(user)
    is_org_admin = user.admin?
    is_author = model.author == user

    is_space_admin || is_org_admin || is_author
  end

  # Add JWT token to Jitsi URL as query parameter
  def add_jwt_to_jitsi_url(url_to_transform, user)
    return url_to_transform unless user && model

    begin
      # Generate JWT token using the service
      token_generator = Decidim::Meetings::Jitsi::JwtTokenGenerator.new(model, user)
      jwt_token = token_generator.generate

      # Parse URL and add JWT as query parameter
      uri = URI.parse(url_to_transform)
      params = URI.decode_www_form(uri.query || "")
      params << ["jwt", jwt_token]
      uri.query = URI.encode_www_form(params)

      final_url = uri.to_s
      Rails.logger.info("Final live event URL with JWT: #{final_url}")
      final_url
    rescue StandardError => e
      Rails.logger.error("Error adding JWT to live event URL: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      url_to_transform
    end
  end
end

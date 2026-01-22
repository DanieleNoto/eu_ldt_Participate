# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# This decorator extends the Decidim::Meetings::MeetingIframeEmbedder service
# to add JWT token authentication for Jitsi meetings when the user is an admin.
# frozen_string_literal: true

Decidim::Meetings::MeetingIframeEmbedder.class_eval do
  attr_accessor :user, :meeting

  # Store the original initialize method
  alias_method :original_initialize, :initialize

  # Override initialize to accept additional parameters while maintaining backward compatibility
  def initialize(online_meeting_service_url, user: nil, meeting: nil)
    # Call the original initialize method
    original_initialize(online_meeting_service_url)

    # Store additional parameters
    @user = user
    @meeting = meeting
  end

  # Store the original embed_transformed_url method
  alias_method :original_embed_transformed_url, :embed_transformed_url

  # Override embed_transformed_url to add JWT token and toolbar config for Jitsi
  def embed_transformed_url(request_host)
    # First, get the transformed URL from the original method
    transformed_url = original_embed_transformed_url(request_host)

    return transformed_url unless transformed_url.present? && @meeting && jitsi_url?

    # Step 1: Add JWT token if user is admin
    if @user && user_is_admin?
      Rails.logger.info("Adding JWT token to URL")
      transformed_url = add_jwt_to_jitsi_url(transformed_url)
    end

    # Step 2: ALWAYS add toolbar configuration based on moderator status
    # This applies to all users (logged in, non-logged in, moderators, non-moderators)
    is_moderator = @user && user_is_admin?
    Rails.logger.info("Adding toolbar config - is_moderator: #{is_moderator}")
    add_toolbar_config(transformed_url, is_moderator)
  end

  private

  # Check if the URL is a Jitsi URL based on configured Jitsi servers
  def jitsi_url?
    return false unless @meeting&.component&.settings

    jitsi_server = @meeting.component.settings.jitsi_server_url
    return false if jitsi_server.blank?

    # Normalize URLs for comparison
    jitsi_host = URI.parse(jitsi_server).host
    meeting_host = parsed_online_meeting_uri.host

    jitsi_host == meeting_host
  rescue URI::InvalidURIError => e
    Rails.logger.error("Invalid URI: #{e.message}")
    false
  end

  # Check if the current user is an admin of the meeting
  def user_is_admin?
    return false unless @user && @meeting

    is_space_admin = @meeting.component.participatory_space.admins.include?(@user)
    is_org_admin = @user.admin?
    is_author = @meeting.author == @user

    # Check if user is an admin of the participatory space
    is_space_admin || is_org_admin || is_author
  end

  # Add JWT token to Jitsi URL as query parameter
  def add_jwt_to_jitsi_url(url_to_transform)
    return url_to_transform unless @user && @meeting

    begin
      # Extract room name from URL
      room_name = extract_jitsi_room_name

      # Generate JWT token
      token = Decidim::Meetings::Jitsi::JwtTokenGenerator.new(
        user: @user,
        meeting: @meeting,
        room_name: room_name
      ).generate

      # Add token to URL
      uri = URI.parse(url_to_transform)
      existing_query = uri.query ? CGI.parse(uri.query) : {}
      existing_query["jwt"] = [token]
      uri.query = URI.encode_www_form(existing_query)

      uri.to_s
    rescue StandardError => e
      Rails.logger.error("Failed to generate JWT for Jitsi meeting: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      # Fallback to original URL if JWT generation fails
      url_to_transform
    end
  end

  # Add toolbar configuration to Jitsi URL via hash fragment
  # This is applied to ALL users (logged in or not, moderator or not)
  def add_toolbar_config(url_to_transform, is_moderator)
    begin
      uri = URI.parse(url_to_transform)
      
      # For non-moderators, restrict toolbar buttons and disable local recording and screen sharing
      unless is_moderator
        toolbar_buttons = build_toolbar_buttons_for_non_moderators
        buttons_json = toolbar_buttons.to_json
        
        config_params = []
        config_params << "config.toolbarButtons=#{CGI.escape(buttons_json)}"
        config_params << "config.localRecording.disable=true"
        config_params << "config.disableDesktopSharing=true"
        
        # Preserve existing fragment if any, or set new one
        existing_fragment = uri.fragment.presence
        uri.fragment = if existing_fragment
                        "#{existing_fragment}&#{config_params.join('&')}"
                      else
                        config_params.join('&')
                      end
        
        Rails.logger.info("Added toolbar restrictions for non-moderator (recording and screen sharing disabled)")
      else
        Rails.logger.info("Moderator: no toolbar restrictions applied")
      end

      uri.to_s
    rescue StandardError => e
      Rails.logger.error("Failed to add toolbar config: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      # Fallback to original URL if config addition fails
      url_to_transform
    end
  end

  # Build toolbar buttons list for non-moderators (without 'recording' and 'desktop' buttons)
  def build_toolbar_buttons_for_non_moderators
    # Default buttons based on your ConfigMap, excluding 'recording' and 'desktop' (screen sharing)
    %w[
      camera chat closedcaptions download embedmeeting
      etherpad feedback filmstrip fullscreen hangup help highlight
      invite linktosalesforce livestreaming microphone participants-pane
      profile raisehand security select-background settings shortcuts
      tileview toggle-camera videoquality
    ]
  end

  # Extract the Jitsi room name from the URL
  def extract_jitsi_room_name
    # Jitsi room name is typically the last segment of the path
    path_segments = parsed_online_meeting_uri.path.split("/").compact_blank
    path_segments.last || "unknown-room"
  end
end

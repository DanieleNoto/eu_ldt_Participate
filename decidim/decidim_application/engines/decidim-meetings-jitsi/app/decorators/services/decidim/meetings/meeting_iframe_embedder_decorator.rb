# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



# This decorator extends the Decidim::Meetings::MeetingIframeEmbedder service
# to add JWT token authentication for Jitsi meetings when the user is an admin.
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

  # Override embed_transformed_url to add JWT token for Jitsi admin users
  def embed_transformed_url(request_host)
    # First, get the transformed URL from the original method
    transformed_url = original_embed_transformed_url(request_host)

    # If we have user, meeting, and it's a Jitsi URL with admin user, add JWT token
    if transformed_url.present? && @user && @meeting && jitsi_url? && user_is_admin?
      Rails.logger.info("Adding JWT token to URL")
      add_jwt_to_jitsi_url(transformed_url)
    else
      Rails.logger.info("Not adding JWT token")
      transformed_url
    end
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

      final_url = uri.to_s
      
      final_url
    rescue StandardError => e
      Rails.logger.error("Failed to generate JWT for Jitsi meeting: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      # Fallback to original URL if JWT generation fails
      url_to_transform
    end
  end

  # Extract the Jitsi room name from the URL
  def extract_jitsi_room_name
    # Jitsi room name is typically the last segment of the path
    path_segments = parsed_online_meeting_uri.path.split("/").reject(&:blank?)
    path_segments.last || "unknown-room"
  end
end
# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



class JitsiUrlController < Decidim::Admin::ApplicationController
  # Default constants for Jitsi
  JITSI_DEFAULT_SERVER_URL = "https://jitsi-part-int.ldttoolbox.app/"
  JITSI_DEFAULT_ROOM_PREFIX = "decidim-meeting-"

  before_action :load_meeting
  before_action :set_component_context

  # POST /generate-jitsi-url (AJAX)
  def generate
    meeting = @meeting
    return render json: error_payload("Meeting not found"), status: :not_found unless meeting
    return render json: error_payload("You must be authenticated"), status: :unauthorized unless current_user
    return render json: error_payload("Access denied"), status: :forbidden unless current_user.organization == meeting.organization

    # Set current_component context for permission system (since route not namespaced by component)
    @current_component = meeting.component

    enforce_permission_to :update, :meeting, meeting: meeting

  unless meeting_uses_jitsi_generator?(meeting)
      return render json: error_payload("Jitsi generator not enabled for this meeting"), status: :unprocessable_entity
    end

  new_url = build_jitsi_url_for(meeting)
    render json: { success: true, url: new_url, message: "Jitsi URL successfully generated" }
  rescue Decidim::ActionForbidden
    render json: error_payload("Not authorized"), status: :forbidden
  rescue StandardError => e
    Rails.logger.error "Jitsi URL generation error: #{e.class} - #{e.message}\n#{e.backtrace.first(8).join("\n")}"
    render json: error_payload("Error generating Jitsi URL"), status: :internal_server_error
  end

  private

  # Needed because we are outside the normal admin resources routing
  attr_reader :current_component

  def load_meeting
    @meeting = Decidim::Meetings::Meeting.find_by(id: params[:meeting_id])
  end

  def set_component_context
    return unless @meeting&.component
    request.env["decidim.current_component"] = @meeting.component
  end

  # Replicate the permission chain used in component admin controllers so :update, :meeting works
  def permission_class_chain
    return super unless @meeting&.component && @meeting.component.respond_to?(:manifest)

    component = @meeting.component
    space = component.participatory_space
    [
      component.manifest.permissions_class,
      space.manifest.permissions_class,
      Decidim::Admin::Permissions
    ].compact
  end

  def error_payload(message)
    { success: false, message: }
  end

  # Fallback in case decorator wasn't loaded yet
  def meeting_uses_jitsi_generator?(meeting)
    if meeting.respond_to?(:jitsi_generator_enabled?)
      meeting.jitsi_generator_enabled?
    else
      settings = meeting.component&.settings
      settings && settings.respond_to?(:enable_jitsi_generator) && settings.enable_jitsi_generator
    end
  end

  def build_jitsi_url_for(meeting)
    if meeting.respond_to?(:generate_jitsi_url)
      meeting.generate_jitsi_url
    else
      settings = meeting.component&.settings
      jitsi_server = (settings&.jitsi_server_url.presence || JITSI_DEFAULT_SERVER_URL).chomp("/")
      prefix = settings&.jitsi_room_prefix.presence || JITSI_DEFAULT_ROOM_PREFIX
      room_identifier = SecureRandom.hex(4)
      room_name = "#{prefix}#{room_identifier}".parameterize
      "#{jitsi_server}/#{room_name}"
    end
  end
end
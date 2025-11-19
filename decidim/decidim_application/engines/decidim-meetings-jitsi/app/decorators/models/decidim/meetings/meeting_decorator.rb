# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# This creates the class structure that Zeitwerk expects to find
# frozen_string_literal: true

module Models
  module Decidim
    module Meetings
      class MeetingDecorator
      end
    end
  end
end

# Decorator to extend the Meeting model with Jitsi features
Decidim::Meetings::Meeting.class_eval do
  # Generates a Jitsi URL based on the component settings
  def generate_jitsi_url
    return nil unless component&.settings

    jitsi_server = component.settings.jitsi_server_url.presence || Decidim::Meetings::Jitsi::Constants::JITSI_DEFAULT_SERVER_URL
    jitsi_prefix = component.settings.jitsi_room_prefix.presence || Decidim::Meetings::Jitsi::Constants::JITSI_DEFAULT_ROOM_PREFIX
    jitsi_server = jitsi_server.chomp("/")
    room_identifier = SecureRandom.hex(4)
    room_name = "#{jitsi_prefix}#{room_identifier}".parameterize
    "#{jitsi_server}/#{room_name}"
  end

  # Checks if the current URL is a Jitsi URL from our server
  def has_generated_jitsi_url?
    return false unless online? && online_meeting_url.present? && component&.settings

    jitsi_server = component.settings.jitsi_server_url.presence || Decidim::Meetings::Jitsi::Constants::JITSI_DEFAULT_SERVER_URL
    jitsi_server = jitsi_server.chomp("/")
    online_meeting_url.start_with?(jitsi_server)
  end

  # Checks if the Jitsi generator is enabled for this component
  def jitsi_generator_enabled?
    component&.settings&.enable_jitsi_generator || false
  end
end

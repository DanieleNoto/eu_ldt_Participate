# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# This creates the class structure that Zeitwerk expects to find
# frozen_string_literal: true

module Forms
  module Decidim
    module Meetings
      module Admin
        class MeetingFormDecorator
          # Empty class required by Zeitwerk autoloader structure
          # Actual decorator logic is in the file below
        end
      end
    end
  end
end

# Decorator to extend the admin form with Jitsi helpers
Decidim::Meetings::Admin::MeetingForm.class_eval do
  # Helper to get the Jitsi server URL from the component settings
  def jitsi_server_url
    return Decidim::Meetings::Jitsi::Constants::JITSI_DEFAULT_SERVER_URL unless current_component&.settings

    server_url = current_component.settings.jitsi_server_url.presence || Decidim::Meetings::Jitsi::Constants::JITSI_DEFAULT_SERVER_URL
    server_url.start_with?("http://", "https://") ? server_url : "https://#{server_url}"
  end

  # Helper to get the Jitsi room prefix
  def jitsi_room_prefix
    return Decidim::Meetings::Jitsi::Constants::JITSI_DEFAULT_ROOM_PREFIX unless current_component&.settings

    current_component.settings.jitsi_room_prefix.presence || Decidim::Meetings::Jitsi::Constants::JITSI_DEFAULT_ROOM_PREFIX
  end

  # Checks if the Jitsi generator is enabled
  def jitsi_generator_enabled?
    return false unless current_component&.settings

    current_component.settings.enable_jitsi_generator || false
  end
end

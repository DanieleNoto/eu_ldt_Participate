# frozen_string_literal: true

# Decorator to extend the admin form with Jitsi helpers
Decidim::Meetings::Admin::MeetingForm.class_eval do
  # Default constants for Jitsi
  JITSI_DEFAULT_SERVER_URL = "https://meet.jit.si"
  JITSI_DEFAULT_ROOM_PREFIX = "decidim-meeting-"

  # Helper to get the Jitsi server URL from the component settings
  def jitsi_server_url
    return JITSI_DEFAULT_SERVER_URL unless current_component&.settings
    current_component.settings.jitsi_server_url.presence || JITSI_DEFAULT_SERVER_URL
  end

  # Helper to get the Jitsi room prefix
  def jitsi_room_prefix
    return JITSI_DEFAULT_ROOM_PREFIX unless current_component&.settings
    
    current_component.settings.jitsi_room_prefix.presence || JITSI_DEFAULT_ROOM_PREFIX
  end

  # Checks if the Jitsi generator is enabled
  def jitsi_generator_enabled?
    return false unless current_component&.settings
    
    current_component.settings.enable_jitsi_generator || false
  end
end
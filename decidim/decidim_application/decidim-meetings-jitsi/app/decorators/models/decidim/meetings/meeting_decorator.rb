# frozen_string_literal: true

# Decorator to extend the Meeting model with Jitsi features
Decidim::Meetings::Meeting.class_eval do
  # Default constants for Jitsi
  JITSI_DEFAULT_SERVER_URL = "https://meet.jit.si"
  JITSI_DEFAULT_ROOM_PREFIX = "decidim-meeting-"

  # Generates a Jitsi URL based on the component settings
  def generate_jitsi_url
    return nil unless component&.settings

    jitsi_server = component.settings.jitsi_server_url.presence || JITSI_DEFAULT_SERVER_URL
    jitsi_prefix = component.settings.jitsi_room_prefix.presence || JITSI_DEFAULT_ROOM_PREFIX
    jitsi_server = jitsi_server.chomp("/")
    room_identifier = SecureRandom.hex(4)
    room_name = "#{jitsi_prefix}#{room_identifier}".parameterize
    "#{jitsi_server}/#{room_name}"
  end

  # Checks if the current URL is a Jitsi URL from our server
  def has_generated_jitsi_url?
    return false unless online? && online_meeting_url.present? && component&.settings

    jitsi_server = component.settings.jitsi_server_url.presence || JITSI_DEFAULT_SERVER_URL
    jitsi_server = jitsi_server.chomp("/")
    online_meeting_url.start_with?(jitsi_server)
  end

  # Checks if the Jitsi generator is enabled for this component
  def jitsi_generator_enabled?
    component&.settings&.enable_jitsi_generator || false
  end
end
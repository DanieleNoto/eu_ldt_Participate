# frozen_string_literal: true

# Decorator to extend the admin form with Jitsi helpers
Decidim::Meetings::Admin::MeetingForm.class_eval do
  # Helper to get the Jitsi server URL from the component settings
  def jitsi_server_url
    return "https://meet.jit.si" unless current_component&.settings
    
    current_component.settings.jitsi_server_url || "https://meet.jit.si"
  end

  # Helper to get the Jitsi room prefix
  def jitsi_room_prefix
    return "decidim-meeting-" unless current_component&.settings
    
    current_component.settings.jitsi_room_prefix || "decidim-meeting-"
  end

  # Checks if the Jitsi generator is enabled
  def jitsi_generator_enabled?
    return false unless current_component&.settings
    
    current_component.settings.enable_jitsi_generator || false
  end
end
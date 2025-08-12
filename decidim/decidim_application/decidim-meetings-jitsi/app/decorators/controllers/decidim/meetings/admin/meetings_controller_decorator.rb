# frozen_string_literal: true

# Decorator to add the Jitsi URL generation action
Decidim::Meetings::Admin::MeetingsController.class_eval do
  # Action to generate a new Jitsi URL via AJAX
  def generate_jitsi_url
    enforce_permission_to :update, :meeting, meeting: meeting
    
    if meeting.jitsi_generator_enabled?
      new_url = meeting.generate_jitsi_url
      
      render json: { 
        success: true, 
        url: new_url,
        message: I18n.t("jitsi_url_generated", scope: "decidim.meetings.admin.meetings")
      }
    else
      render json: { 
        success: false, 
        message: I18n.t("jitsi_generator_disabled", scope: "decidim.meetings.admin.meetings")
      }
    end
  rescue StandardError => e
    render json: { 
      success: false, 
      message: I18n.t("jitsi_url_error", scope: "decidim.meetings.admin.meetings")
    }
  end
end
# frozen_string_literal: true

# This decorator extends the Decidim::Meetings::OnlineMeetingCell
# to pass user and meeting information to MeetingIframeEmbedder for JWT token generation

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
      # Use embedder to get the transformed URL with JWT token if applicable
      transformed = embedder.embed_transformed_url(request.host)
      Rails.logger.info("Live event URL transformed: #{transformed}")
      transformed || model.online_meeting_url
    end
  end
end

# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



# This decorator extends the Decidim::Meetings::LiveEventsController
# to pass user and meeting information to MeetingIframeEmbedder for JWT token generation in live event iframes

Rails.logger.info("=== Loading LiveEventsController Decorator ===")

Decidim::Meetings::LiveEventsController.class_eval do
  # Override live_meeting_embed_code to pass user and meeting for JWT token generation
  def live_meeting_embed_code
    Decidim::Meetings::MeetingIframeEmbedder.new(
      meeting.online_meeting_url,
      user: current_user,
      meeting: meeting
    ).embed_code(request.host)
  end
end
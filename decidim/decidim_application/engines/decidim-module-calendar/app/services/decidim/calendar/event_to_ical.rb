# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Denis Vasilev Dimchev



module Decidim
  module Calendar
    class EventToIcal
      include ActionView::Helpers::SanitizeHelper
      include Decidim::TranslationsHelper

      def initialize(event)
        @event = event
      end

      def ical
        return @ical if @ical

        @ical = Icalendar::Event.new
        @ical.dtstart = Icalendar::Values::DateTime.new(@event.start)
        @ical.dtend = Icalendar::Values::DateTime.new(@event.finish)
        @ical.summary = "#{translated_attribute @event.full_title} - #{translated_attribute @event.subtitle}"
        @ical.url = @event.link
        @ical
      end

      delegate :to_ical, to: :ical
    end
  end
end
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Denis Vasilev Dimchev
  # Gianfranco Cedro


# Decidim Calendar Configuration
Decidim::Calendar.configure do |config|
  # Colors per type of event
  # You can generate a nice color palette here: https://coolors.co
  # Just remove any event type that you don't want in your calendar
  config.events = {
    "Decidim::ParticipatoryProcessStep" => {
      color: "var(--primary)",
      fontColor: "#fff", # used when "color" is used as background
      id: :participatory_step
    },
    "Decidim::Meetings::Meeting" => {
      color: "var(--tertiary)",
      fontColor: "#000",
      id: :meeting
    },
    "Decidim::Calendar::ExternalEvent" => {
      color: "#C21D76",
      fontColor: "#fff",
      id: :external_event
    },
    "Decidim::Debates::Debate" => {
      color: "#388E3C",
      fontColor: "#fff",
      id: :debate
    },
    # optional events, it is save to define it here even if not installed (will be ignored)
    "Decidim::Consultation" => {
      color: "#92278f",
      fontColor: "#fff",
      id: :consultation
    }
  }

  config.calendar_options = {
    # 0 for sunday, 1 for monday, etc
    firstDay: 1,
    # one of: dayGridMonth,dayGridWeek,dayGridDay,listWeek,listMonth,list
    defaultView: "dayGridMonth",
    # use "true" to get a am/pm format
    hour12: false,
    # several of: dayGridMonth,dayGridWeek,dayGridDay,listWeek,listMonth,listYear
    views: "dayGridMonth,dayGridWeek,dayGridDay,listWeek",
    # Forces to open all event links in a new window
    openInNewWindow: true
  }
end
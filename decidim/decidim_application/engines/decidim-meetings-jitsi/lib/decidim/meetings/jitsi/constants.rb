# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

module Decidim
  module Meetings
    module Jitsi
      # Shared constants for Jitsi integration
      module Constants
        def self.normalize_server_url(server_url)
          clean_server_url = server_url.sub(/\Ahttps?:\/\//, "")
          "https://#{clean_server_url}"
        end

        JITSI_DEFAULT_SERVER_URL = normalize_server_url(ENV.fetch("DECIDIM_JITSI_URL", "jitsi-part-int.ldttoolbox.app/"))
        JITSI_DEFAULT_ROOM_PREFIX = ENV.fetch("DECIDIM_JITSI_ROOM_PREFIX", "decidim-meeting-")
      end
    end
  end
end

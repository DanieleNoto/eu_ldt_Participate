# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

module Decidim
  # This holds the decidim-extra_user_fields version.
  module ExtraUserFields
    VERSION = "0.31.0"
    COMPAT_DECIDIM_VERSION = [">= 0.30.0", "< 0.32.0"].freeze

    def self.version
      VERSION
    end

    def self.decidim_version
      COMPAT_DECIDIM_VERSION
    end
  end
end

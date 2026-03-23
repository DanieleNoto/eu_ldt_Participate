# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

module Decidim
  # Holds decidim-calendar version
  module Calendar
    DECIDIM_VERSION = "0.31.0"
    COMPAT_DECIDIM_VERSION = [">= 0.30.0", "< 0.32.0"].freeze

    def self.version
      "0.31.0"
    end
  end
end

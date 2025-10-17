# frozen_string_literal: true

module Decidim
  # This holds the decidim-extra_user_fields version.
  module ExtraUserFields
    VERSION = "0.30.1"

    def self.version
      VERSION
    end

    def self.decidim_version
      [">= 0.30.1"].freeze
    end
  end
end

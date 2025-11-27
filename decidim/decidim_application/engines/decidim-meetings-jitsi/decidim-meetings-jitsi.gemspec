# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require_relative "lib/decidim/meetings/jitsi/version"

Gem::Specification.new do |spec|
  spec.name = "decidim-meetings-jitsi"
  spec.version = Decidim::Meetings::Jitsi::VERSION
  spec.authors = ["Gianfranco Cedro"]
  spec.email = ["gianfranco.cedro@eng.it"]
  spec.homepage = "https://decidim.org"
  spec.summary = "Jitsi integration for Decidim Meetings"
  spec.description = "Extends Decidim Meetings component to support Jitsi for online meetings"
  spec.license = "AGPL-3.0-or-later"
  spec.required_ruby_version = ">= 3.1"
  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/decidim/decidim"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end

  # Decidim Dependencies
  spec.add_dependency "decidim-core", "~> 0.30.4"
  spec.add_dependency "decidim-meetings", "~> 0.30.4"
  spec.add_dependency "rails", ">= 7.0.8.7"

  # JWT authentication for Jitsi (must match Decidim's jwt version)
  spec.add_dependency "jwt", "~> 3.0"
end

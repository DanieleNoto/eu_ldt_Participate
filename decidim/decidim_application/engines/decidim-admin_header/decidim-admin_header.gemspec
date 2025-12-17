# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require_relative "lib/decidim/admin_header/version"

Gem::Specification.new do |spec|
  spec.name = "decidim-admin_header"
  spec.version = Decidim::AdminHeader::VERSION
  spec.authors = ["Gianfranco Cedro"]
  spec.email = ["gianfranco.cedro@eng.it"]
  spec.homepage = "https://decidim.org"
  spec.summary = "Tool0 LDT Header integration"
  spec.description = "Integration of Tool0 LDT Header into Decidim."
  spec.license = "AGPL-3.0-or-later"
  spec.required_ruby_version = ">= 3.3"
  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/decidim/decidim"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end

  spec.add_dependency "deface", ">= 1.0"
  spec.add_dependency "rails", ">= 7.0.8.7"
end

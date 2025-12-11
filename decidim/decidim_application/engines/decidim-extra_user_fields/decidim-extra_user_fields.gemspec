# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require_relative "lib/decidim/extra_user_fields/version"

Gem::Specification.new do |spec|
  spec.name = "decidim-extra_user_fields"
  spec.version = Decidim::ExtraUserFields::VERSION
  spec.required_ruby_version = ">= 3.3"
  spec.authors = ["Gianfranco Cedro"]
  spec.email = ["gianfranco.cedro@eng.it"]
  spec.homepage = "https://decidim.org"
  spec.summary = "Decidim Extra user fields engine"
  spec.description = "Engine forked from gem https://github.com/PopulateTools/decidim-module-extra_user_fields"
  spec.license = "AGPL-3.0-or-later"
  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/decidim/decidim"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end

  spec.add_dependency "country_select", "~> 4.0"
  spec.add_dependency "decidim-core", "~> 0.30.0"
  spec.add_dependency "decidim-admin", "~> 0.30.0"
  spec.add_dependency "deface", "~> 1.9"
end

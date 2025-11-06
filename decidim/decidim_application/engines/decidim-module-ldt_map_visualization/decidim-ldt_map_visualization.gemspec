# frozen_string_literal: true

$LOAD_PATH.push File.expand_path("lib", __dir__)

require "decidim/ldt_map_visualization/version"

Gem::Specification.new do |s|
  s.version = Decidim::LdtMapVisualization.version
  s.authors = [""]
  s.email = [""]
  s.license = "AGPL-3.0-or-later"
  s.homepage = "https://decidim.org"
  s.metadata = {
    "bug_tracker_uri" => "https://github.com/decidim/decidim/issues",
    "documentation_uri" => "https://docs.decidim.org/",
    "funding_uri" => "https://opencollective.com/decidim",
    "homepage_uri" => "https://decidim.org",
    "source_code_uri" => "https://github.com/decidim/decidim"
  }
  s.required_ruby_version = "~> 3.3"

  s.name = "decidim-ldt_map_visualization"
  s.summary = "A decidim ldt_map_visualization module"
  s.description = "."

  s.files = Dir.chdir(__dir__) do
    `git ls-files -z`.split("\x0").select do |f|
      (File.expand_path(f) == __FILE__) ||
        f.start_with?(*%w(app/ config/ db/ lib/ LICENSE-AGPLv3.txt Rakefile README.md))
    end
  end

  s.add_dependency "decidim-core", Decidim::LdtMapVisualization.version
end

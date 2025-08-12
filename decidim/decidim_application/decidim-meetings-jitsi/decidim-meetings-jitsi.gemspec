require_relative "lib/decidim/meetings/jitsi/version"

Gem::Specification.new do |spec|
  spec.name        = "decidim-meetings-jitsi"
  spec.version     = Decidim::Meetings::Jitsi::VERSION
  spec.authors     = ["Gianfranco Cedro"]
  spec.email       = ["gianfranco.cedro@eng.it"]
  spec.homepage    = "https://dev.azure.com/EULDT-Toolbox/_git/EU%20LDT%20Participate?path=/decidim/decidim_application/decidim-meetings-jitsi"
  spec.summary     = "Jitsi integration for Decidim Meetings"
  spec.description = "Extends Decidim Meetings component to support Jitsi for online meetings"

  # Prevent pushing this gem to RubyGems.org. To allow pushes either set the "allowed_push_host"
  # to allow pushing to a single host or delete this section to allow pushing to any host.
  spec.metadata["allowed_push_host"] = "TODO: Set to 'http://mygemserver.com'"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://dev.azure.com/EULDT-Toolbox/_git/EU%20LDT%20Participate?path=/decidim/decidim_application/decidim-meetings-jitsi"
  spec.metadata["changelog_uri"] = "https://dev.azure.com/EULDT-Toolbox/_git/EU%20LDT%20Participate?path=/decidim/decidim_application/decidim-meetings-jitsi/CHANGELOG.MD"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end

  # Decidim Dependencies
  spec.add_dependency "decidim-core", "~> 0.30.1"
  spec.add_dependency "decidim-meetings", "~> 0.30.1"
  spec.add_dependency "rails", ">= 7.0.8.7"
  
  # Development dependencies
  spec.add_development_dependency "decidim-dev", "~> 0.30.1"
end

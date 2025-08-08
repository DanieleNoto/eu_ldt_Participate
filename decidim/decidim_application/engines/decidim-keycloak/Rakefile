# frozen_string_literal: true

require "decidim/dev/common_rake"
require "decidim/keycloak/generators/secrets_generator"

desc "Generates a dummy app for testing"
task test_app: "decidim:generate_external_test_app" do
  ENV["RAILS_ENV"] = "test"
  Decidim::Keycloak::Generators::SecretsGenerator.start
end

desc "Generates a development app."
task development_app: "decidim:generate_external_development_app" do
  Decidim::Keycloak::Generators::SecretsGenerator.start
end

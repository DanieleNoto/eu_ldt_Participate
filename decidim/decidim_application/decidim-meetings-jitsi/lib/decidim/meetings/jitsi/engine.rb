# frozen_string_literal: true

require_relative "constants"

module Decidim
  module Meetings
    module Jitsi
      class Engine < ::Rails::Engine
        isolate_namespace Decidim::Meetings::Jitsi

  # Load decorators when the app is prepared
        config.to_prepare do
          Dir.glob("#{Decidim::Meetings::Jitsi::Engine.root}/app/decorators/**/*_decorator.rb").each do |decorator|
            require_dependency decorator
          end
        end

  # Add Jitsi settings to the existing meetings component
        initializer "decidim_meetings_jitsi.setup" do
          Decidim.find_component_manifest(:meetings).settings(:global) do |settings|
            settings.attribute :jitsi_server_url, type: :string, default: Decidim::Meetings::Jitsi::JITSI_DEFAULT_SERVER_URL
            settings.attribute :jitsi_room_prefix, type: :string, default: Decidim::Meetings::Jitsi::JITSI_DEFAULT_ROOM_PREFIX
            settings.attribute :enable_jitsi_generator, type: :boolean, default: true
          end
        end

  # Register assets if needed
        initializer "decidim_meetings_jitsi.assets" do
          if respond_to?(:register_assets_path)
            Decidim.register_assets_path File.expand_path("app/packs", root)
          end
        end

  # Add view paths
        initializer "decidim_meetings_jitsi.add_view_paths" do
          ActionController::Base.prepend_view_path "#{root}/app/views"
        end
      end
    end
  end
end
module Decidim
  module AdminHeader
    class Engine < ::Rails::Engine
      isolate_namespace Decidim::AdminHeader
      
      initializer "decidim_admin_header.assets" do
        assets_path = File.expand_path("config/assets.rb", root)
        load assets_path if File.exist?(assets_path)
      end
    end
  end
end

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

module Decidim
  module Analytics
    # This is the engine that runs on the public interface of `Analytics`.
    class AdminEngine < ::Rails::Engine
      isolate_namespace Decidim::Analytics::Admin

      routes do
        resources :analytics, only: [:index]
        resources :statistics, only: [:index]
        root to: "analytics#index"
      end

      initializer "decidim_analytics.admin_mount_routes" do
        Decidim::Core::Engine.routes do
          mount Decidim::Analytics::AdminEngine, at: "/admin/analytics", as: "decidim_admin_analytics"
        end
      end

      initializer "decidim_analytics.admin_menu" do
        Decidim.menu :admin_menu do |menu|
          menu.add_item :analytics,
                        I18n.t("menu.analytics", scope: "decidim.analytics"),
                        decidim_admin_analytics.analytics_path,
                        icon_name: "pie-chart-2-line",
                        position: 7.2,
                        active: :inclusive,
                        if: proc { |context|
                          ENV["MATOMO_ENABLED"] == "true" &&
                            context[:current_user] &&
                            context[:current_user].admin? &&
                            context[:current_organization]
                        }

          menu.add_item :statistics,
                        I18n.t("menu.statistics", scope: "decidim.analytics"),
                        decidim_admin_analytics.statistics_path,
                        icon_name: "bar-chart-box-line",
                        position: 7.3,
                        active: :inclusive,
                        if: proc { |context|
                          context[:current_user] &&
                            context[:current_user].admin? &&
                            context[:current_organization]
                        }
        end
      end

      initializer "decidim_admin.register_icons" do |_app|
        Decidim.icons.register(name: "pie-chart-2-line", icon: "pie-chart-2-line", category: "system", description: "", engine: :core)
        Decidim.icons.register(name: "bar-chart-box-line", icon: "bar-chart-box-line", category: "system", description: "", engine: :core)
      end
    end
  end
end

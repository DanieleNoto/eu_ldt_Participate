# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Overrides upstream MenuBreadcrumbLastActivityCell to use a TTL-based cache key
# instead of activity-content-based.
#
# Upstream problem: cache_hash calls valid_activities to compute the hash, which
# runs the full expensive LastActivity SQL query on EVERY request just to check
# whether the cache is still valid. This causes thundering-herd OOM after deploys
# (cold cache) because all concurrent requests run the heavy query simultaneously.
#
# Fix: use a 5-minute time bucket as cache key. The expensive query runs at most
# once per 5-minute window instead of on every request.
module Decidim
  module ContentBlocks
    class MenuBreadcrumbLastActivityCell < Decidim::ViewModel
      include Decidim::Core::Engine.routes.url_helpers

      CACHE_TTL_SECONDS = 300 # 5 minutes

      def show
        return if current_user.blank? && current_organization&.force_users_to_authenticate_before_access_organization

        return if valid_activities.empty?

        render
      end

      def valid_activities
        return @valid_activities if defined?(@valid_activities)

        valid_activities_count = 0
        @valid_activities = []

        activities.includes([:user]).each do |activity|
          break if valid_activities_count == activities_to_show

          if activity.visible_for?(current_user)
            @valid_activities << activity
            valid_activities_count += 1
          end
        end

        @valid_activities
      end

      private

      # TTL-based cache key: expires every CACHE_TTL_SECONDS regardless of content.
      # Avoids running the expensive LastActivity query just to compute cache validity.
      def cache_hash
        time_bucket = Time.now.to_i / CACHE_TTL_SECONDS
        [
          "decidim/content_blocks/menu_breadcrumb_last_activity",
          id_prefix,
          I18n.locale.to_s,
          time_bucket.to_s
        ].join(Decidim.cache_key_separator)
      end

      def activities
        @activities ||= if model.is_a?(Decidim::Organization)
                          Decidim::LastActivity.new(model).query
                        else
                          Decidim::ParticipatorySpaceLastActivity.new(model).query
                        end.limit(activities_to_show * 6)
      end

      def activities_options
        @activities_options ||= { id_prefix: }.merge(options.slice(:hide_participatory_space))
      end

      def id_prefix
        @id_prefix ||= options[:id_prefix] || model.respond_to?(:to_gid) ? model.to_gid.to_param : "menu-breadcrumb"
      end

      def activities_to_show
        4
      end
    end
  end
end

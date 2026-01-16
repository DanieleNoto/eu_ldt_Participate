# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Decorator to fix NoMethodError in NotificationGenerator
# This decorator adds type checking to prevent crashes when non-User objects
# (like Organization instances) are incorrectly passed as recipients
#
# Original gem code tries to call notification_types on recipients,
# but sometimes Organization instances are passed instead of Users
module Decidim
  module NotificationGeneratorDecorator
    # Override generate to filter out invalid recipients
    # Prevents NoMethodError: undefined method `notification_types' for Organization
    def generate
      return unless resource
      return unless event_class.types.include?(:notification)

      # Filter followers to ensure they respond to notification_types
      valid_followers = followers.select { |recipient| recipient.respond_to?(:notification_types) }
      
      valid_followers.each do |recipient|
        generate_notification_for(recipient, user_role: :follower) if ["all", "followed-only"].include?(recipient.notification_types)
      end

      # Filter affected_users to ensure they respond to notification_types
      valid_affected_users = affected_users.select { |recipient| recipient.respond_to?(:notification_types) }
      
      valid_affected_users.each do |recipient|
        generate_notification_for(recipient, user_role: :affected_user) if ["all", "own-only"].include?(recipient.notification_types)
      end
      
      # Log warning if any invalid recipients were filtered out
      invalid_count = (followers.size - valid_followers.size) + (affected_users.size - valid_affected_users.size)
      if invalid_count > 0
        Rails.logger.warn("NotificationGenerator: Filtered out #{invalid_count} invalid recipient(s) (non-User objects)")
      end
    end
  end
end

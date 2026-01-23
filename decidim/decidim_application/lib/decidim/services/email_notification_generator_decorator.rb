# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Decorator to fix NoMethodError in EmailNotificationGenerator
# This decorator adds type checking to prevent crashes when non-User objects
# (like Organization instances) are incorrectly passed as recipients
#
# Original gem code tries to call notification_types on recipients,
# but sometimes Organization instances are passed instead of Users
module Decidim
  module EmailNotificationGeneratorDecorator
    # Override send_to_affected_users to filter out invalid recipients
    # Prevents NoMethodError: undefined method `notification_types' for Organization
    def send_to_affected_users
      # Filter to ensure recipients respond to notification_types
      valid_affected_users = affected_users.select { |recipient| recipient.respond_to?(:notification_types) }
      
      valid_affected_users.each do |recipient|
        send_email_to(recipient, user_role: :affected_user) if ["all", "own-only"].include?(recipient.notification_types)
      end
      
      # Log warning if any invalid recipients were filtered out
      invalid_count = affected_users.size - valid_affected_users.size
      if invalid_count > 0
        Rails.logger.warn("EmailNotificationGenerator: Filtered out #{invalid_count} invalid recipient(s) (non-User objects)")
      end
    end
    
    # Override send_to_followers to filter out invalid recipients
    def send_to_followers
      # Filter to ensure recipients respond to notification_types
      valid_followers = followers.select { |recipient| recipient.respond_to?(:notification_types) }
      
      valid_followers.each do |recipient|
        send_email_to(recipient, user_role: :follower) if ["all", "followed-only"].include?(recipient.notification_types)
      end
      
      # Log warning if any invalid recipients were filtered out
      invalid_count = followers.size - valid_followers.size
      if invalid_count > 0
        Rails.logger.warn("EmailNotificationGenerator: Filtered out #{invalid_count} invalid follower(s) (non-User objects)")
      end
    end
  end
end

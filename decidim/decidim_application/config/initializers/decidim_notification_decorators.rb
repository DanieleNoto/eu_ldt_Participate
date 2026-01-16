# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# This initializer ensures that notification generator decorators are loaded
# both at boot time and when classes are reloaded (important for Sidekiq)
#
# We use both require and to_prepare to handle different scenarios:
# 1. require: loads the decorator module immediately
# 2. to_prepare: ensures it's applied when classes are reloaded

# Load the decorator modules
require_relative '../../../lib/decidim/services/notification_generator_decorator'
require_relative '../../../lib/decidim/services/email_notification_generator_decorator'

# Apply decorators at boot time and on class reloads
Rails.application.config.to_prepare do
  # Ensure modules are included
  unless Decidim::NotificationGenerator.ancestors.include?(Decidim::NotificationGeneratorDecorator)
    Decidim::NotificationGenerator.prepend(Decidim::NotificationGeneratorDecorator)
  end
  
  unless Decidim::EmailNotificationGenerator.ancestors.include?(Decidim::EmailNotificationGeneratorDecorator)
    Decidim::EmailNotificationGenerator.prepend(Decidim::EmailNotificationGeneratorDecorator)
  end
end

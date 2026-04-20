# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0

# Add file logging alongside stdout in production
if Rails.env.production? && ENV["RAILS_LOG_TO_STDOUT"].present?
  file_logger = ActiveSupport::Logger.new(Rails.root.join("log/production.log"))
  file_logger.formatter = Rails.application.config.log_formatter || Logger::Formatter.new

  # Extend current logger to broadcast to file
  Rails.logger.extend(ActiveSupport::Logger.broadcast(file_logger))
end

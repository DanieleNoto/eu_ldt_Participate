# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0

# Ensure logs go to both stdout and file in production, regardless of RAILS_LOG_TO_STDOUT.
# Uses ActiveSupport::BroadcastLogger (Rails 7.1+ — ActiveSupport::Logger.broadcast removed).
# - RAILS_LOG_TO_STDOUT set: production.rb set stdout as primary → add file as secondary
# - RAILS_LOG_TO_STDOUT not set: Rails defaults to file logger → add stdout as secondary
if Rails.env.production?
  formatter = Rails.logger.formatter || ::Logger::Formatter.new

  if ENV["RAILS_LOG_TO_STDOUT"].present?
    file_logger = ::Logger.new(Rails.root.join("log/production.log"))
    file_logger.formatter = formatter
    Rails.logger = ActiveSupport::BroadcastLogger.new(Rails.logger, file_logger)
  else
    stdout_logger = ::Logger.new($stdout)
    stdout_logger.formatter = formatter
    Rails.logger = ActiveSupport::BroadcastLogger.new(Rails.logger, stdout_logger)
  end
end

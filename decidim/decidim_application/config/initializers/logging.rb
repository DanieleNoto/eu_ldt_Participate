# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0

# Ensure logs go to both stdout and file in production, regardless of RAILS_LOG_TO_STDOUT.
# - RAILS_LOG_TO_STDOUT set: production.rb already set stdout as primary → add file broadcast
# - RAILS_LOG_TO_STDOUT not set: Rails defaults to file logger → add stdout broadcast
if Rails.env.production?
  if ENV["RAILS_LOG_TO_STDOUT"].present?
    file_logger = ActiveSupport::Logger.new(Rails.root.join("log/production.log"))
    file_logger.formatter = Rails.logger.formatter || Logger::Formatter.new
    Rails.logger.extend(ActiveSupport::Logger.broadcast(file_logger))
  else
    stdout_logger = ActiveSupport::Logger.new($stdout)
    stdout_logger.formatter = Rails.logger.formatter || Logger::Formatter.new
    Rails.logger.extend(ActiveSupport::Logger.broadcast(stdout_logger))
  end
end

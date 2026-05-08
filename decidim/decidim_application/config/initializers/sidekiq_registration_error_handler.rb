# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Handle race condition where a job references a deleted record.
# This can happen when:
# 1. A mailer/job is enqueued with a GlobalID reference to a record
# 2. The record is deleted before the job executes
# 3. Sidekiq tries to deserialize the GlobalID and finds no record
#
# Covered models:
# - Decidim::Meetings::Registration — deleted when a meeting registration is removed
# - Decidim::Report                 — deleted when a moderation report is cleared
# - Decidim::Attachment             — deleted when an attached file is removed

SKIPPABLE_DELETED_RECORD_CLASSES = %w(
  Decidim::Meetings::Registration
  Decidim::Report
  Decidim::Attachment
).freeze

if defined?(Sidekiq)
  class RegistrationDeserializationErrorHandler
    include Sidekiq::ServerMiddleware

    def call(_worker, job, _queue)
      yield
    rescue ActiveJob::DeserializationError => e
      skippable = SKIPPABLE_DELETED_RECORD_CLASSES.any? { |klass| e.message.include?(klass) }

      if skippable
        Rails.logger.warn(
          "Skipping job for deleted record: #{e.message}",
          job_id: job["jid"],
          job_class: job["class"]
        )
      else
        raise
      end
    end
  end

  Sidekiq.configure_server do |config|
    config.server_middleware do |chain|
      chain.add(RegistrationDeserializationErrorHandler)
    end
  end
end

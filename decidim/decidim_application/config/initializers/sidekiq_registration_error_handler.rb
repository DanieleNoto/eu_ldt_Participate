# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# GitHub Copilot
# frozen_string_literal: true

# Handle race condition where a job references a deleted Registration
# This can happen when:
# 1. A mailer job is enqueued with a Registration object
# 2. The registration is deleted before the job executes
# 3. Sidekiq tries to deserialize the GlobalID and finds no record

if defined?(Sidekiq)
  Sidekiq.configure_server do |config|
    config.server_middleware do |chain|
      chain.add(RegistrationDeserializationErrorHandler)
    end
  end

  class RegistrationDeserializationErrorHandler
    include Sidekiq::ServerMiddleware

    def call(_worker, job, _queue)
      yield
    rescue ActiveJob::DeserializationError => e
      # Check if the error is related to a deleted Meeting Registration
      if e.message.include?("Decidim::Meetings::Registration")
        Rails.logger.warn(
          "Skipping mailer job for deleted registration: #{e.message}",
          job_id: job["jid"],
          job_class: job["class"]
        )
        # Don't re-raise - silently skip this job
      else
        # Re-raise other deserialization errors
        raise
      end
    end
  end
end

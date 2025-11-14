# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Denis Vasilev Dimchev



module Decidim
  module Calendar
    module Admin
      class DestroyExternalEvent < Decidim::Command
        def initialize(event)
          @event = event
        end

        def call
          destroy_external_event

          broadcast(:ok)
        end

        private

        attr_reader :event

        def destroy_external_event
          event.destroy!
        end
      end
    end
  end
end
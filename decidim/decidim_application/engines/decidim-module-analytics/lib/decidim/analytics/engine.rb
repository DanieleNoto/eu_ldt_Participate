# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



require "rails"
require "decidim/core"

module Decidim
  module Analytics
    # This is the engine that runs on the public interface of analytics.
    class Engine < ::Rails::Engine
      isolate_namespace Decidim::Analytics
    end
  end
end
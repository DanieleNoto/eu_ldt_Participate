# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# frozen_string_literal: true

Rake::Task["decidim:webpacker:install"].enhance do
  Rake::Task["decidim_calendar:webpacker:install"].invoke
end

Rake::Task["decidim:choose_target_plugins"].enhance do
  ENV["FROM"] = "#{ENV.fetch("FROM", nil)},decidim_calendar"
end

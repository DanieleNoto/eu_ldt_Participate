# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Denis Vasilev Dimchev



require "decidim/dev"

ENV["ENGINE_ROOT"] = File.dirname(__dir__)

Decidim::Dev.dummy_app_path = File.expand_path(File.join(__dir__, "decidim_dummy_app"))

require "decidim/dev/test/base_spec_helper"

RSpec.configure do |config|
  config.before do
    Rails.application.secrets[:omniauth][:keycloakopenid] = { enabled: true }
    Rails.application.reload_routes!
  end
end
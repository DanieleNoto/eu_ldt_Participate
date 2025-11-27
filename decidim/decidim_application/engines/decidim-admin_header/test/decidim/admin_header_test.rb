# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require "test_helper"

class Decidim::AdminHeaderTest < ActiveSupport::TestCase
  test "it has a version number" do
    assert Decidim::AdminHeader::VERSION
  end
end

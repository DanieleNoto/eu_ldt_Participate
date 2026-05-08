# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Marco Pinnella
# Pierluigi Spedicato
# frozen_string_literal: true

module ApplicationHelper
  # Override Decidim's page title to always brand with "Participate" instead of the organization name.
  # Resulting format: "Page Name - Participate" (or just "Participate" on the homepage).
  def decidim_page_title
    "Participate"
  end
end

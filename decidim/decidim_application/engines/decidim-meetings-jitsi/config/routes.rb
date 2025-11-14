# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



# Global route for Jitsi URL generation - simpler and more reliable
Rails.application.routes.draw do
  post "/generate-jitsi-url", to: "jitsi_url#generate", as: :generate_jitsi_url
end
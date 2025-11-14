# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Marco Pinnella
  # Pierluigi Spedicato


# Define an application-wide HTTP permissions policy. For further
# information see https://developers.google.com/web/updates/2018/06/feature-policy
#
# Rails.application.config.permissions_policy do |f|
#   f.camera      :none
#   f.gyroscope   :none
#   f.microphone  :none
#   f.usb         :none
#   f.fullscreen  :self
#   f.payment     :self, "https://secure.example.com"
# end
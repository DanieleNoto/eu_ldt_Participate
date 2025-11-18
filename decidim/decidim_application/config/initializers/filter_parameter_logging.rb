# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Marco Pinnella
# Pierluigi Spedicato
# SPDX-License-Identifier: AGPL-3.0


# Be sure to restart your server when you modify this file.

# Configure parameters to be filtered from the log file. Use this to limit dissemination of
# sensitive information. See the ActiveSupport::ParameterFilter documentation for supported
# notations and behaviors.
Rails.application.config.filter_parameters += [
  :passw, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn
]
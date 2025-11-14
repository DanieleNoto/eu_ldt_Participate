# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Marco Pinnella
  # Pierluigi Spedicato


class ApplicationMailer < ActionMailer::Base
  default from: "from@example.com"
  layout "mailer"
end
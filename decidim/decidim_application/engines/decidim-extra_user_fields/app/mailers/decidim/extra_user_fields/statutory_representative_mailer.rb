# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

module Decidim
  module ExtraUserFields
    class StatutoryRepresentativeMailer < ApplicationMailer
      def inform(user)
        return if user.email.blank?
        return if user.extended_data["statutory_representative_email"].blank?

        with_user(user) do
          @user = user
          @statutory_representative_email = user.extended_data["statutory_representative_email"]
          @organization = user.organization
          @subject = I18n.t("inform.subject", scope: "decidim.statutory_representative")
          @body = I18n.t("inform.body", scope: "decidim.statutory_representative", name: user.name, nickname: user.nickname, organization: organization_name(@organization))

          mail(to: @statutory_representative_email, subject: @subject)
        end
      end
    end
  end
end

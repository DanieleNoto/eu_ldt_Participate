# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro
# frozen_string_literal: true

require "active_support/concern"
require "decidim/extra_user_fields/extended_data_helper"

module Decidim
  module ExtraUserFields
    # Changes in methods to store extra fields in user profile
    module CreateRegistrationsCommandsOverrides
      extend ActiveSupport::Concern
      include ExtendedDataHelper

      def call
        return broadcast(:invalid) if same_email_representative?

        if form.invalid?

          user = User.has_pending_invitations?(form.current_organization.id, form.email)
          user.invite!(user.invited_by) if user
          return broadcast(:invalid)
        end

        create_user
        send_email_to_statutory_representative

        broadcast(:ok, @user)
      rescue ActiveRecord::RecordInvalid
        broadcast(:invalid)
      end

      private

      def create_user
        # Generate a temporary password for Keycloak compatibility
        # The actual authentication is managed by Keycloak
        temporary_password = SecureRandom.hex(16)

        @user = User.create!(
          email: form.email,
          name: form.name,
          nickname: form.nickname,
          password: temporary_password,
          password_updated_at: Time.current,
          organization: form.current_organization,
          tos_agreement: form.tos_agreement,
          newsletter_notifications_at: form.newsletter_at,
          accepted_tos_version: form.current_organization.tos_version,
          locale: form.current_locale,
          extended_data: build_extended_data_from_form(form)
        )
      end

      def send_email_to_statutory_representative
        return if form.statutory_representative_email.blank? || form.underage != "1"

        Decidim::ExtraUserFields::StatutoryRepresentativeMailer.inform(@user).deliver_later
      end

      def same_email_representative?
        return false if form.statutory_representative_email.blank?

        form.statutory_representative_email == form.email
      end
    end
  end
end

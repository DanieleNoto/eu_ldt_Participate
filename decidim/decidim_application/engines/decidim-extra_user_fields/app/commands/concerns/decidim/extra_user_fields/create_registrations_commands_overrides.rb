# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro
# frozen_string_literal: true



require "active_support/concern"

module Decidim
  module ExtraUserFields
    # Changes in methods to store extra fields in user profile
    module CreateRegistrationsCommandsOverrides
      extend ActiveSupport::Concern

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
          extended_data: merge_extended_data
        )
      end

      def merge_extended_data
        current_extended_data = (@user&.extended_data || {})

        # Only set fields that are explicitly provided
        updated_data = {}
        updated_data[:country] = form.country if form.country.present?
        updated_data[:postal_code] = form.postal_code if form.postal_code.present?
        updated_data[:date_of_birth] = form.date_of_birth if form.date_of_birth.present?
        updated_data[:gender] = form.gender if form.gender.present?
        updated_data[:phone_number] = form.phone_number if form.phone_number.present?
        updated_data[:location] = form.location if form.location.present?
        updated_data[:underage] = form.underage if form.underage.present?
        updated_data[:statutory_representative_email] = form.statutory_representative_email if form.statutory_representative_email.present?

        current_extended_data.merge(updated_data)
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
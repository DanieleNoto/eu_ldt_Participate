# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Denis Vasilev Dimchev
  # Gianfranco Cedro



require "active_support/concern"

module Decidim
  module ExtraUserFields
    # Changes in methods to store extra fields in user profile
    module OmniauthCommandsOverrides
      extend ActiveSupport::Concern

      def call
        return broadcast(:invalid) if same_email_representative?

        verify_oauth_signature!

        begin
          if existing_identity
            user = existing_identity.user
            verify_user_confirmed(user)

            return broadcast(:ok, user)
          end
          return broadcast(:invalid) if form.invalid?

          transaction do
            create_or_find_user
            send_email_to_statutory_representative
            @identity = create_identity
          end
          trigger_omniauth_registration

          broadcast(:ok, @user)
        rescue ActiveRecord::RecordInvalid => e
          broadcast(:error, e.record)
        end
      end

      private

      def create_or_find_user
        @user = User.find_or_initialize_by(
          email: verified_email,
          organization:
        )

        if @user.persisted?
          # If user has left the account unconfirmed and later on decides to sign
          # in with omniauth with an already verified account, the account needs
          # to be marked confirmed.
          @user.skip_confirmation! if !@user.confirmed? && @user.email == verified_email
        else
          generated_password = SecureRandom.hex

          @user.email = (verified_email || form.email)
          @user.name = form.name
          @user.nickname = form.normalized_nickname
          @user.newsletter_notifications_at = nil
          @user.password = generated_password
          @user.password_confirmation = generated_password
          if form.avatar_url.present?
            url = URI.parse(form.avatar_url)
            filename = File.basename(url.path)
            file = url.open
            @user.avatar.attach(io: file, filename:)
          end
          @user.skip_confirmation! if verified_email
        end

        @user.tos_agreement = "1"
        @user.extended_data = merge_extended_data
        @user.save!
      end

      def merge_extended_data
        current_extended_data = (@user&.extended_data || {})

        # For new users on first login, set all provided fields
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
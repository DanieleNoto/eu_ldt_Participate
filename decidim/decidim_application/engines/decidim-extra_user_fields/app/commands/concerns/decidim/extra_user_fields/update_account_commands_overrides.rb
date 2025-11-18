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
    module UpdateAccountCommandsOverrides
      extend ActiveSupport::Concern

      private

      def update_personal_data
        super if defined?(super)
        current_user.locale = form.locale
        current_user.name = form.name
        current_user.nickname = form.nickname
        current_user.email = form.email
        current_user.personal_url = form.personal_url
        current_user.about = form.about
        current_user.extended_data = merge_extended_data
      end

      def merge_extended_data
        current_extended_data = (current_user&.extended_data || {})

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
    end
  end
end
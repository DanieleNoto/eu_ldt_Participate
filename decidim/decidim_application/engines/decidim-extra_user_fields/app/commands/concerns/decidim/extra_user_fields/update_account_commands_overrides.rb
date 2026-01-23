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
    module UpdateAccountCommandsOverrides
      extend ActiveSupport::Concern
      include ExtendedDataHelper

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
        merge_form_extended_data(current_user&.extended_data, form)
      end
    end
  end
end

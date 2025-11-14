# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



module Decidim
  module ExtraUserFields
    # Custom helpers, scoped to the extra_user_fields engine.
    #
    module ApplicationHelper
      def gender_options_for_select
        Decidim::ExtraUserFields::Engine::DEFAULT_GENDER_OPTIONS.map do |gender|
          [gender, I18n.t(gender, scope: "decidim.extra_user_fields.genders")]
        end
      end

      def phone_number_extra_user_field_pattern
        current_organization.extra_user_field_configuration(:phone_number)["pattern"]
      end

      def phone_number_extra_user_field_placeholder
        current_organization.extra_user_field_configuration(:phone_number)["placeholder"]
      end
    end
  end
end
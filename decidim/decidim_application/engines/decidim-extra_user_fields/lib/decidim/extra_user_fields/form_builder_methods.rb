# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

module Decidim
  module ExtraUserFields
    # This module adds the FormBuilder methods for extra user fields
    module FormBuilderMethods
      def custom_country_select(name, options = {})
        label_text = options[:label].to_s
        label_text = label_for(name) if label_text.blank?

        template = ""
        template += (label_text + required_for_attribute(name)) if options.fetch(:label, true)
        template += country_select(
          name,
          { 
            include_blank: I18n.t("decidim.extra_user_fields.select_country_placeholder", default: "Select your country"),
            priority_countries: ["GB", "DE", "FR", "ES"]
          },
          { 
            selected: object.try(name),
            class: "select2" 
          }
        )
        template.html_safe
      end
    end
  end
end

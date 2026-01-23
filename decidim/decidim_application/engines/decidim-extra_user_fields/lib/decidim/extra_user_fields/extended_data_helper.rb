# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro
# frozen_string_literal: true

module Decidim
  module ExtraUserFields
    # Helper module for building extended_data from form fields
    module ExtendedDataHelper
      EXTENDED_DATA_FIELDS = [
        :country,
        :postal_code,
        :date_of_birth,
        :gender,
        :phone_number,
        :location,
        :underage,
        :statutory_representative_email
      ].freeze

      # Builds a hash of extended data from form fields that have values present
      #
      # @param form [Object] The form object containing extended data fields
      # @return [Hash] Hash of field names to values for present fields
      def build_extended_data_from_form(form)
        return {} unless form

        EXTENDED_DATA_FIELDS.each_with_object({}) do |field, data|
          next unless form.respond_to?(field)
          
          value = form.public_send(field)
          
          # Handle different types of values
          case value
          when String
            data[field] = value unless value.blank?
          when Date, Time, DateTime
            data[field] = value.to_s
          when TrueClass, FalseClass
            data[field] = value.to_s
          when Numeric
            data[field] = value.to_s
          else
            data[field] = value if value.present?
          end
        rescue => e
          Rails.logger.warn "Error processing field #{field}: #{e.message}"
          # Skip this field and continue
        end
      end

      # Merges form extended data with existing user extended data
      #
      # @param current_data [Hash, nil] The current extended_data hash
      # @param form [Object] The form object containing extended data fields
      # @return [Hash] Merged extended data
      def merge_form_extended_data(current_data, form)
        (current_data || {}).merge(build_extended_data_from_form(form))
      end
    end
  end
end

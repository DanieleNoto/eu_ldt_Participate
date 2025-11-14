# frozen_string_literal: true

require "active_support/concern"

module Decidim
  module ExtraUserFields
    # Extra user fields definitions for forms
    module FormsDefinitions
      extend ActiveSupport::Concern

      included do
        include ::Decidim::ExtraUserFields::ApplicationHelper

        # Block ExtraUserFields Attributes

        attribute :country, String
        attribute :postal_code, String
        attribute :date_of_birth, Decidim::Attributes::LocalizedDate
        attribute :gender, String
        attribute :phone_number, String
        attribute :location, String
        attribute :underage, ActiveRecord::Type::Boolean
        attribute :statutory_representative_email, String

        # Account profile attributes
        attribute :about, String
        attribute :personal_url, String

        # EndBlock

        # Block ExtraUserFields Validations

        validates :country, presence: true, if: :country_required?
        validates :postal_code, presence: true, if: :postal_code_required?
        validates :postal_code, length: { maximum: 50 }, if: :postal_code?
        validates :date_of_birth, presence: true, if: :date_of_birth_required?
        validates :gender, presence: true, if: :gender_required?
        validates :gender, inclusion: { in: Decidim::ExtraUserFields::Engine::DEFAULT_GENDER_OPTIONS.map(&:to_s) }, if: :gender?
        validates :phone_number, presence: true, if: :phone_number_required?
        validates :phone_number, length: { maximum: 100 }, if: :phone_number?
        validates(
          :phone_number,
          format: { 
            with: ->(form) { 
              pattern = form.current_organization.extra_user_field_configuration(:phone_number)["pattern"]
              pattern.present? ? Regexp.new(pattern) : /.*/ 
            } 
          },
          if: :phone_number_format_valid?
        )

        validates :location, presence: true, if: :location_required?
        validates :location, length: { maximum: 100 }, if: :location?
        validates :underage, presence: true, if: :underage_required?

        # Account profile validations
        validates :about, length: { maximum: 500 }, allow_blank: true
        validates :personal_url, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]), message: :invalid_url }, allow_blank: true
        validates :statutory_representative_email,
                  presence: true,
                  "valid_email_2/email": { disposable: true },
                  if: :underage_accepted?
        validates :statutory_representative_email, length: { maximum: 100 }, if: :underage_accepted?
        validate :birth_date_under_limit, if: :should_validate_birth_date?
        validate :birth_date_not_in_future, if: :date_of_birth?

        # EndBlock
      end

      def map_model(model)
        extended_data = model.extended_data.with_indifferent_access

        self.country = extended_data[:country]
        self.postal_code = extended_data[:postal_code]
        self.date_of_birth = Date.parse(extended_data[:date_of_birth]) if extended_data[:date_of_birth].present?
        self.gender = extended_data[:gender]
        self.phone_number = extended_data[:phone_number]
        self.location = extended_data[:location]
        self.underage = extended_data[:underage]
        self.statutory_representative_email = extended_data[:statutory_representative_email]

        # Block ExtraUserFields MapModel

        # EndBlock
      end

      private

      # Block ExtraUserFields EnableFieldMethod
      def country?
        extra_user_fields_enabled && current_organization.activated_extra_field?(:country)
      end

      def country_required?
        country? && registration_form?
      end

      def date_of_birth?
        extra_user_fields_enabled && current_organization.activated_extra_field?(:date_of_birth)
      end

      def date_of_birth_required?
        date_of_birth? && registration_form?
      end

      def gender?
        extra_user_fields_enabled && current_organization.activated_extra_field?(:gender)
      end

      def gender_required?
        gender? && registration_form?
      end

      def postal_code?
        extra_user_fields_enabled && current_organization.activated_extra_field?(:postal_code)
      end

      def postal_code_required?
        postal_code? && registration_form?
      end

      def phone_number?
        extra_user_fields_enabled && current_organization.activated_extra_field?(:phone_number)
      end

      def phone_number_required?
        phone_number? && registration_form?
      end

      def phone_number_format_valid?
        return unless phone_number? && phone_number.present?

        current_organization.extra_user_field_configuration(:phone_number)["pattern"].present?
      end

      def location?
        extra_user_fields_enabled && current_organization.activated_extra_field?(:location)
      end

      def location_required?
        location? && registration_form?
      end

      def underage?
        extra_user_fields_enabled && current_organization.activated_extra_field?(:underage)
      end

      def underage_required?
        underage? && registration_form?
      end

      def underage_accepted?
        underage? && underage == "1"
      end

      def should_validate_birth_date?
        date_of_birth? && underage? && date_of_birth.present?
      end

      # EndBlock

      def extra_user_fields_enabled
        @extra_user_fields_enabled ||= current_organization.extra_user_fields_enabled?
      end

      # Method to check if birth date is under the limit
      def birth_date_not_in_future
        return if date_of_birth.blank?

        if date_of_birth > Time.zone.today
          errors.add(:date_of_birth, :future_date)
        end
      end

      def birth_date_under_limit
        return unless date_of_birth? && underage?

        return if date_of_birth.blank? || underage.blank? || underage_limit.blank?

        age = calculate_age(date_of_birth)

        validate_age(age)
      end

      def calculate_age(date_of_birth)
        Time.zone.today.year - date_of_birth.year - (Time.zone.today.yday < date_of_birth.yday ? 1 : 0)
      end

      def validate_age(age)
        errors.add(:date_of_birth, :underage) unless underage_within_limit?(age)
        underage_within_limit?(age)
      end

      def underage_within_limit?(age)
        (date_of_birth.present? && age < underage_limit && underage_accepted?) || (age > underage_limit && !underage_accepted?)
      end

      def underage_limit
        current_organization.extra_user_fields["underage_limit"]
      end

      def registration_form?
        self.class.name == "Decidim::RegistrationForm" || 
          self.class.name == "Decidim::OmniauthRegistrationForm"
      end

      def account_edit_form?
        self.class.name == "Decidim::AccountForm"
      end
    end
  end
end

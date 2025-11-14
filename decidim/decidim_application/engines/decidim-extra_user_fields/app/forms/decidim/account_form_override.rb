# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Denis Vasilev Dimchev



module Decidim
  # Override the AccountForm to skip old_password validation while keeping password validation
  module AccountFormOverride
    extend ActiveSupport::Concern

    included do
      # Skip the validate_old_password method entirely
      # This allows password changes without requiring the current password
      define_method :validate_old_password do
        # Do nothing - skip old password validation
      end
    end
  end
end

# Prepend the override to the AccountForm so it takes precedence
Decidim::AccountForm.send(:prepend, Decidim::AccountFormOverride) if defined?(Decidim::AccountForm)
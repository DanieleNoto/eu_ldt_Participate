# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



module Decidim
  module ExtraUserFields
    module Admin
      # This controller is the abstract class from which all other controllers of
      # this engine inherit.
      class ApplicationController < Decidim::Admin::ApplicationController
        def permission_class_chain
          [::Decidim::ExtraUserFields::Admin::Permissions] + super
        end

        def user_not_authorized_path
          decidim.root_path
        end

        def user_has_no_permission_path
          decidim.root_path
        end
      end
    end
  end
end
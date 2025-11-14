# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Denis Vasilev Dimchev



module Decidim
  module Calendar
    module Admin
      class Permissions < Decidim::DefaultPermissions
        def permissions
          return permission_action unless user
          return permission_action unless permission_action.scope == :admin

          unless user.admin?
            disallow!
            return permission_action
          end

          allow!
          permission_action
        end
      end
    end
  end
end
# frozen_string_literal: true

module Decidim
  module LdtUseCaseScenarios
    module Admin
      class Permissions < Decidim::DefaultPermissions
        def permissions
          return permission_action if permission_action.scope != :admin
          return permission_action unless user&.admin?

          allow! if can_access?

          permission_action
        end

        def can_access?
          permission_action.subject == :ldt_use_case_scenarios &&
            permission_action.action == :read
        end
      end
    end
  end
end

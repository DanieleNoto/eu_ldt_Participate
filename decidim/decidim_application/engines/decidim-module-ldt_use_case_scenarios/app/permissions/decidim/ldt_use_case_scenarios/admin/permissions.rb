# frozen_string_literal: true

module Decidim
  module LdtUseCaseScenarios
    module Admin
      class Permissions < Decidim::DefaultPermissions
        def permissions
          return permission_action if permission_action.scope != :admin
          return permission_action unless user&.admin?

          allow! if can_manage?

          permission_action
        end

        def can_manage?
          permission_action.subject == :ldt_use_case_scenario &&
            [:read, :create, :update, :destroy].include?(permission_action.action)
        end
      end
    end
  end
end

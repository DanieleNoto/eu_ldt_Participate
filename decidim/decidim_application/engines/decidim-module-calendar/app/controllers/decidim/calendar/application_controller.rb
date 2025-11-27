# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

module Decidim
  module Calendar
    class ApplicationController < Decidim::ApplicationController
      include NeedsPermission

      private

      def permission_class_chain
        [
          Decidim::Permissions
        ]
      end

      def permission_scope
        :public
      end
    end
  end
end

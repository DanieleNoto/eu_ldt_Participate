# frozen_string_literal: true

module Decidim
  module AdminHeader
    class ApplicationsController < Decidim::Admin::ApplicationController
      def index
        data = Tool0ApiService.new(current_user: current_user).fetch_applications
        
        # Sort groups by order and applications within each group by order
        if data["groups"]
          sorted_groups = data["groups"].sort_by { |group| group["order"] || 0 }
          sorted_groups.each do |group|
            if group["applications"]
              group["applications"] = group["applications"].sort_by { |app| app["order"] || 0 }
            end
          end
          data["groups"] = sorted_groups
        end
        
        render json: data
      end
    end
  end
end
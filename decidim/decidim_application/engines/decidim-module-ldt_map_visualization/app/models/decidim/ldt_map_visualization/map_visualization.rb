# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



module Decidim
  module LdtMapVisualization
    # Model to store map visualizations linked to a component
    # Stores the full map JSON from TOOL1 so it can be displayed to citizens
    class MapVisualization < ApplicationRecord
      include Decidim::HasComponent
      include Decidim::Resourceable
      include Decidim::HasReference
      include Decidim::Traceable
      
      self.table_name = "decidim_ldt_map_visualizations"
      
      component_manifest_name "ldt_map_visualization"
      
      validates :name, presence: true
      validates :map_id, presence: true
      
      # Parse map_data JSON for easy access
      def parsed_map_data
        return {} if map_data.blank?
        @parsed_map_data ||= JSON.parse(map_data)
      rescue JSON::ParserError
        {}
      end
      
      # Helper methods to access common map attributes from JSON
      def map_name
        parsed_map_data["name"] || name
      end
      
      def map_image
        parsed_map_data["map_image"]
      end
      
      def map_owner
        parsed_map_data["owner"]
      end
      
      def map_scope
        parsed_map_data["scope"]
      end
      
      def map_description
        parsed_map_data["description"]
      end
    end
  end
end
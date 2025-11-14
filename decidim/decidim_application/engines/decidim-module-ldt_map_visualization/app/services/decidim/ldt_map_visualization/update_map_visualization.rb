# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



module Decidim
  module LdtMapVisualization
    class UpdateMapVisualization
      def self.call(form, model)
        new(form, model).call
      end

      def initialize(form, model)
        @form = form
        @model = model
      end

      def call
        if valid?
          yield :ok if block_given?
        else
          yield :invalid if block_given?
        end
      end

      private

      def valid?
        @form.name.to_s.strip != "" || @form.map_id.to_s.strip != ""
      end
    end
  end
end
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Fixes NoMethodError when exporting an empty questionnaire as PDF.
# Upstream bug: collection.first.first.questionnaire crashes when collection is empty.
# See: decidim-forms-0.31.3/lib/decidim/exporters/form_pdf.rb:66
module Decidim
  module Exporters
    module FormPDFDecorator
      protected

      def add_data!
        return if collection.empty? || questionnaire.nil?

        super
      end

      def questionnaire
        collection.first&.first&.questionnaire
      end
    end
  end
end

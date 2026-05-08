# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Applies FormPDFDecorator to fix a nil crash when exporting an empty questionnaire as PDF.
require_relative '../../lib/decidim/decorators/form_pdf_decorator'

Rails.application.config.to_prepare do
  unless Decidim::Exporters::FormPDF.ancestors.include?(Decidim::Exporters::FormPDFDecorator)
    Decidim::Exporters::FormPDF.prepend(Decidim::Exporters::FormPDFDecorator)
  end
end

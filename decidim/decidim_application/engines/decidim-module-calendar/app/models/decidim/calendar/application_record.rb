# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro

# frozen_string_literal: true

module Decidim
  module Calendar
    class ApplicationRecord < ActiveRecord::Base
      self.abstract_class = true
    end
  end
end

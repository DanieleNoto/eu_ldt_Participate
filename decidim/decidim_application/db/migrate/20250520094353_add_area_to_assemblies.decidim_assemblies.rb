# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddAreaToAssemblies < ActiveRecord::Migration[5.1]
  def change
    add_reference :decidim_assemblies, :decidim_area, index: true
  end
end

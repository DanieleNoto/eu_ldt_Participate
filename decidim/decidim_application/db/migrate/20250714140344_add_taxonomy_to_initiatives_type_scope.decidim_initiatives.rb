# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddTaxonomyToInitiativesTypeScope < ActiveRecord::Migration[7.0]
  def change
    add_reference :decidim_initiatives_type_scopes, :decidim_taxonomy, index: true
  end
end

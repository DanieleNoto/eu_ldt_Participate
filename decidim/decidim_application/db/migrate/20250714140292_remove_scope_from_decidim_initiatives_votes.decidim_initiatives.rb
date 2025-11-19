# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class RemoveScopeFromDecidimInitiativesVotes < ActiveRecord::Migration[5.1]
  def change
    remove_column :decidim_initiatives_votes, :scope, :integer
  end
end

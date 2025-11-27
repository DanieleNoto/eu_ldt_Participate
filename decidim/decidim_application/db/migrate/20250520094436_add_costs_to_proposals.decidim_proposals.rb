# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddCostsToProposals < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_proposals_proposals, :cost, :decimal
    add_column :decidim_proposals_proposals, :cost_report, :jsonb
    add_column :decidim_proposals_proposals, :execution_period, :jsonb
  end
end

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddProposalValuationAssignments < ActiveRecord::Migration[5.2]
  def change
    create_table :decidim_proposals_valuation_assignments do |t|
      t.references :decidim_proposal, null: false, index: { name: "decidim_proposals_valuation_assignment_proposal" }
      t.references :valuator_role, polymorphic: true, null: false, index: { name: "decidim_proposals_valuation_assignment_valuator_role" }

      t.timestamps
    end
  end
end

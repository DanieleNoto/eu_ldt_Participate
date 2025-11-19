# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddValuationAssignmentsCountToDecidimProposalsProposals < ActiveRecord::Migration[6.1]
  def change
    add_column :decidim_proposals_proposals, :valuation_assignments_count, :integer, default: 0

    reversible do |dir|
      dir.up do
        Decidim::Proposals::Proposal.reset_column_information
        Decidim::Proposals::Proposal.unscoped.find_each do |record|
          Decidim::Proposals::Proposal.reset_counters(record.id, :valuation_assignments)
        end
      end
    end
  end
end

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddIndexToDecidimProposalsProposalsProposalVotesCount < ActiveRecord::Migration[5.0]
  def change
    add_index :decidim_proposals_proposals, :proposal_votes_count
    add_index :decidim_proposals_proposals, :created_at
    add_index :decidim_proposals_proposals, :state
  end
end

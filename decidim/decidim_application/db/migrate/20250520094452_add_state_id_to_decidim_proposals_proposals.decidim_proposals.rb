# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

# This migration comes from decidim_proposals (originally 20240110203502)
# This file has been modified by `decidim upgrade:migrations` task on 2025-12-09 10:59:49 UTC
class AddStateIdToDecidimProposalsProposals < ActiveRecord::Migration[6.1]
  def up
    add_column :decidim_proposals_proposals, :decidim_proposals_proposal_state_id, :integer, index: true
    add_foreign_key :decidim_proposals_proposals, :decidim_proposals_proposal_states, column: :decidim_proposals_proposal_state_id
  end

  def down
    remove_foreign_key :decidim_proposals_proposals, column: :decidim_proposals_proposal_state_id
    remove_column :decidim_proposals_proposals, :decidim_proposals_proposal_state_id
  end
end

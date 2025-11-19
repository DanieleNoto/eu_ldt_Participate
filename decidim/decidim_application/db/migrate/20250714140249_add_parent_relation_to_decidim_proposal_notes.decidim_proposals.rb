# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddParentRelationToDecidimProposalNotes < ActiveRecord::Migration[7.0]
  def change
    add_reference :decidim_proposals_proposal_notes, :parent, index: { name: :decidim_proposals_proposal_notes_on_parent_id }
  end
end

# frozen_string_literal: true

# This migration comes from decidim_proposals (originally 20240617170052)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:59 UTC
class AddParentRelationToDecidimProposalNotes < ActiveRecord::Migration[7.0]
  def change
    add_reference :decidim_proposals_proposal_notes, :parent, index: { name: :decidim_proposals_proposal_notes_on_parent_id }
  end
end

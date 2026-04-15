# frozen_string_literal: true

# This migration comes from decidim_proposals (originally 20240110203503)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:59 UTC
class RemoveStateFromDecidimProposalsProposals < ActiveRecord::Migration[6.1]
  def up
    rename_column :decidim_proposals_proposals, :state, :old_state
  end

  def down
    rename_column :decidim_proposals_proposals, :old_state, :state
  end
end

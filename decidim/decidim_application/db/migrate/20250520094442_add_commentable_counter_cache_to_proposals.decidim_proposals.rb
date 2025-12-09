# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

# This migration comes from decidim_proposals (originally 20200827154156)
# This file has been modified by `decidim upgrade:migrations` task on 2025-12-09 10:59:49 UTC
class AddCommentableCounterCacheToProposals < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_proposals_proposals, :comments_count, :integer, null: false, default: 0, index: true
    add_column :decidim_proposals_collaborative_drafts, :comments_count, :integer, null: false, default: 0, index: true
    Decidim::Proposals::Proposal.reset_column_information
    Decidim::Proposals::Proposal.unscoped.find_each(&:update_comments_count)
    Decidim::Proposals::CollaborativeDraft.unscoped.reset_column_information
    Decidim::Proposals::CollaborativeDraft.unscoped.find_each(&:update_comments_count)
  end
end

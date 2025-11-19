# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddAnswersToProposals < ActiveRecord::Migration[5.0]
  def change
    add_column :decidim_proposals_proposals, :state, :string
    add_index :decidim_proposals_proposals, :state
    add_column :decidim_proposals_proposals, :answered_at, :datetime
    add_index :decidim_proposals_proposals, :answered_at
    add_column :decidim_proposals_proposals, :answer, :jsonb
  end
end

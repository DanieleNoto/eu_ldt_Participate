# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddPublishedAtToProposals < ActiveRecord::Migration[5.1]
  def up
    add_column :decidim_proposals_proposals, :published_at, :datetime
    add_index :decidim_proposals_proposals, :published_at
    # rubocop:disable Rails/SkipsModelValidations
    Decidim::Proposals::Proposal.unscoped.update_all("published_at = updated_at")
    # rubocop:enable Rails/SkipsModelValidations
  end

  def down
    remove_column :decidim_proposals_proposals, :published_at
  end
end

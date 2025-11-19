# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class DropProposalEndorsements < ActiveRecord::Migration[5.2]
  def change
    drop_table :decidim_proposals_proposal_endorsements, if_exists: true, force: :restrict
    remove_column :decidim_proposals_proposals, :proposal_endorsements_count
  end
end

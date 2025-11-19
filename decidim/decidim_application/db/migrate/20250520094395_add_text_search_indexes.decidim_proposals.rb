# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddTextSearchIndexes < ActiveRecord::Migration[5.0]
  def change
    add_index :decidim_proposals_proposals, :title, name: "decidim_proposals_proposal_title_search"
    add_index :decidim_proposals_proposals, :body, name: "decidim_proposals_proposal_body_search"
  end
end

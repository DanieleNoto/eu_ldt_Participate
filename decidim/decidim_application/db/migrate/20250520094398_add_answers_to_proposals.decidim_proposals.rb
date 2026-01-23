# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

# This migration comes from decidim_proposals (originally 20170131092413)
# This file has been modified by `decidim upgrade:migrations` task on 2025-12-09 10:59:49 UTC
class AddAnswersToProposals < ActiveRecord::Migration[5.0]
  def change
    add_column :decidim_proposals_proposals, :state, :string, index: true
    add_column :decidim_proposals_proposals, :answered_at, :datetime, index: true
    add_column :decidim_proposals_proposals, :answer, :jsonb
  end
end

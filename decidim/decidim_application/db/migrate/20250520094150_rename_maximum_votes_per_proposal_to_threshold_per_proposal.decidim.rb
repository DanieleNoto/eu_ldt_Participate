# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class RenameMaximumVotesPerProposalToThresholdPerProposal < ActiveRecord::Migration[5.1]
  def up
    execute <<~SQL.squish
      UPDATE decidim_components
      SET settings = jsonb_set(
        settings::jsonb,
        array['global'],
        (settings->'global')::jsonb - 'maximum_votes_per_proposal' || jsonb_build_object('threshold_per_proposal', settings->'global'->'maximum_votes_per_proposal')
        )
      WHERE manifest_name = 'proposals'
    SQL
  end

  def down
    execute <<~SQL.squish
      UPDATE decidim_components
      SET settings = jsonb_set(
        settings::jsonb,
        array['global'],
        (settings->'global')::jsonb - 'threshold_per_proposal' || jsonb_build_object('maximum_votes_per_proposal', settings->'global'->'threshold_per_proposal')
        )
      WHERE manifest_name = 'proposals'
    SQL
  end
end

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddCommentVoteCounterCacheToComments < ActiveRecord::Migration[6.1]
  def change
    add_column :decidim_comments_comments, :up_votes_count, :integer, null: false, default: 0
    add_index :decidim_comments_comments, :up_votes_count
    add_column :decidim_comments_comments, :down_votes_count, :integer, null: false, default: 0
    add_index :decidim_comments_comments, :down_votes_count

    # We cannot use the reset_counters as up_votes and down_votes are scoped associationws
    reversible do |dir|
      dir.up do
        Decidim::Comments::Comment.reset_column_information
        Decidim::Comments::Comment.find_each do |record|
          # rubocop:disable Rails/SkipsModelValidations
          record.class.update_counters(record.id, up_votes_count: record.up_votes.length)
          record.class.update_counters(record.id, down_votes_count: record.down_votes.length)
          # rubocop:enable Rails/SkipsModelValidations
        end
      end
    end
  end
end

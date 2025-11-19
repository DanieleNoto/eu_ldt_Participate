# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddCommentableCounterCacheToDebates < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_debates_debates, :comments_count, :integer, null: false, default: 0
    add_index :decidim_debates_debates, :comments_count
    Decidim::Debates::Debate.reset_column_information

    # rubocop:disable Rails/SkipsModelValidations
    Decidim::Debates::Debate.unscoped.includes(:comments).find_each do |debate|
      debate.update_columns(comments_count: debate.comments.not_hidden.count)
    end
    # rubocop:enable Rails/SkipsModelValidations
  end
end

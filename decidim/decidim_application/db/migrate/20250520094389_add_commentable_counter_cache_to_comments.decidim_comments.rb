# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

# This migration comes from decidim_comments (originally 20200828101910)
# This file has been modified by `decidim upgrade:migrations` task on 2025-12-09 10:59:48 UTC
class AddCommentableCounterCacheToComments < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_comments_comments, :comments_count, :integer, null: false, default: 0, index: true
    Decidim::Comments::Comment.reset_column_information
    Decidim::Comments::Comment.find_each(&:update_comments_count)
  end
end

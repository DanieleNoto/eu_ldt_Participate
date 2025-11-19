# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddAuthorToDecidimBlogsPosts < ActiveRecord::Migration[5.1]
  def change
    add_column :decidim_blogs_posts, :decidim_author_id, :integer
    add_index :decidim_blogs_posts, :decidim_author_id
  end
end

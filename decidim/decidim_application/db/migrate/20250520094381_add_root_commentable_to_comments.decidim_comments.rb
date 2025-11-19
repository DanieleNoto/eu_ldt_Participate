# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddRootCommentableToComments < ActiveRecord::Migration[5.0]
  def change
    change_table :decidim_comments_comments do |t|
      t.references :decidim_root_commentable, polymorphic: true, index: { name: "decidim_comments_comment_root_commentable" }
    end
  end
end

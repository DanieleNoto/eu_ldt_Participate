# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class SetRootCommentableNullConstraints < ActiveRecord::Migration[5.0]
  def change
    change_column_null(:decidim_comments_comments, :decidim_root_commentable_id, false)
    change_column_null(:decidim_comments_comments, :decidim_root_commentable_type, false)
  end
end

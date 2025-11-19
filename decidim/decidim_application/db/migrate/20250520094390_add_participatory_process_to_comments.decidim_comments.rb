# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddParticipatoryProcessToComments < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_comments_comments, :decidim_participatory_space_type, :string
    add_column :decidim_comments_comments, :decidim_participatory_space_id, :integer

    add_index :decidim_comments_comments,
              [:decidim_participatory_space_id, :decidim_participatory_space_type],
              name: "index_decidim_comments_on_decidim_participatory_space"
  end
end

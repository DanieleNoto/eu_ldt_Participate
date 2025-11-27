# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class MakeCategoriesPolymorphic < ActiveRecord::Migration[5.1]
  def change
    remove_index :decidim_categories,
                 name: "index_decidim_categories_on_decidim_participatory_process_id"

    add_column :decidim_categories, :decidim_participatory_space_type, :string

    reversible do |direction|
      direction.up do
        execute <<~SQL.squish
          UPDATE decidim_categories
          SET decidim_participatory_space_type = 'Decidim::ParticipatoryProcess'
        SQL
      end
    end

    rename_column :decidim_categories,
                  :decidim_participatory_process_id,
                  :decidim_participatory_space_id

    add_index :decidim_categories,
              [:decidim_participatory_space_id, :decidim_participatory_space_type],
              name: "index_decidim_categories_on_decidim_participatory_space"
  end
end

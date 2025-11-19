# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddFollowableCounterCacheToInitiatives < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_initiatives, :follows_count, :integer, null: false, default: 0
    add_index :decidim_initiatives, :follows_count

    reversible do |dir|
      dir.up do
        Decidim::Initiative.reset_column_information
        Decidim::Initiative.find_each do |record|
          record.class.reset_counters(record.id, :follows)
        end
      end
    end
  end
end

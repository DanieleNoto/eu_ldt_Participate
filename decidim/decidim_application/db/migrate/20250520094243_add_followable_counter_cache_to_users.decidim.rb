# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddFollowableCounterCacheToUsers < ActiveRecord::Migration[5.2]
  class Follow < ApplicationRecord
    self.table_name = "decidim_follows"
  end

  class User < ApplicationRecord
    self.table_name = "decidim_users"
    self.inheritance_column = nil # disable the default inheritance

    default_scope { where(type: "Decidim::User") }
  end

  def change
    add_column :decidim_users, :follows_count, :integer, null: false, default: 0
    add_index :decidim_users, :follows_count

    reversible do |dir|
      dir.up do
        User.find_each do |record|
          record.update!(follows_count: Follow.where(decidim_user_id: record.id).count)
        end
      end
    end
  end
end

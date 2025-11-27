# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class DestroyDeletedUsersFollows < ActiveRecord::Migration[5.2]
  class Follow < ApplicationRecord
    self.table_name = "decidim_follows"
  end

  class User < ApplicationRecord
    self.table_name = "decidim_users"
  end

  def change
    deleted_users = User.where.not(deleted_at: nil).pluck(:id)
    Follow.where(decidim_followable_type: "Decidim::UserBaseEntity", decidim_followable_id: deleted_users).destroy_all
    Follow.where(decidim_user_id: deleted_users).destroy_all
  end
end

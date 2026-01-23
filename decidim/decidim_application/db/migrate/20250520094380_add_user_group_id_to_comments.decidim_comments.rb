# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

# This migration comes from decidim_comments (originally 20170123102043)
# This file has been modified by `decidim upgrade:migrations` task on 2025-12-09 10:59:48 UTC
class AddUserGroupIdToComments < ActiveRecord::Migration[5.0]
  def change
    add_column :decidim_comments_comments, :decidim_user_group_id, :integer, index: true
  end
end

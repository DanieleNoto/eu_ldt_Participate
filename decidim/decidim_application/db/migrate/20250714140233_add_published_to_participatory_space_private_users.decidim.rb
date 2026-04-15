# frozen_string_literal: true

# This migration comes from decidim (originally 20241001140408)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class AddPublishedToParticipatorySpacePrivateUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_participatory_space_private_users, :published, :boolean, default: false
  end
end

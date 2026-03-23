# frozen_string_literal: true

# This migration comes from decidim_debates (originally 20241017153555)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:59 UTC
class AddCommentsLayoutToDebates < ActiveRecord::Migration[7.0]
  def change
    add_column :decidim_debates_debates, :comments_layout, :string
  end
end

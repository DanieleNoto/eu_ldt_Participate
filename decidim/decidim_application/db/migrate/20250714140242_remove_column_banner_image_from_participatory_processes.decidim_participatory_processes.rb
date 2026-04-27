# frozen_string_literal: true

# This migration comes from decidim_participatory_processes (originally 20241108141514)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:59 UTC
class RemoveColumnBannerImageFromParticipatoryProcesses < ActiveRecord::Migration[7.0]
  def change
    remove_column :decidim_participatory_processes, :banner_image, :string
  end
end

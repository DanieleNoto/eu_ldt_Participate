# frozen_string_literal: true

# This migration comes from decidim (originally 20240326104215)
# This file has been modified by `decidim upgrade:migrations` task on 2026-03-13 11:21:58 UTC
class RemoveShowInFooterInStaticPages < ActiveRecord::Migration[6.1]
  def change
    remove_column :decidim_static_pages, :show_in_footer, :boolean
  end
end

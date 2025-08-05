# frozen_string_literal: true

# This migration comes from decidim_participatory_processes (originally 20240529161054)
# This file has been modified by `decidim upgrade:migrations` task on 2025-07-14 14:03:08 UTC
class AddLinkToDecidimAttachments < ActiveRecord::Migration[6.1]
  def change
    add_column :decidim_attachments, :link, :string
  end
end

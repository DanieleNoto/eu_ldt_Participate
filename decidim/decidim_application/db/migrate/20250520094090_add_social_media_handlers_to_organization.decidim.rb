# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddSocialMediaHandlersToOrganization < ActiveRecord::Migration[5.0]
  def change
    add_column :decidim_organizations, :instagram_handler, :string
    add_column :decidim_organizations, :facebook_handler, :string
    add_column :decidim_organizations, :youtube_handler, :string
    add_column :decidim_organizations, :github_handler, :string
  end
end

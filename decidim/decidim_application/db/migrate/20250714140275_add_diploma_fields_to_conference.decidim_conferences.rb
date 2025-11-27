# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev

# frozen_string_literal: true

class AddDiplomaFieldsToConference < ActiveRecord::Migration[5.2]
  def change
    add_column :decidim_conferences, :signature_name, :string
    add_column :decidim_conferences, :signature, :string
    add_column :decidim_conferences, :main_logo, :string
    add_column :decidim_conferences, :sign_date, :date
    add_index :decidim_conferences, :sign_date
    add_column :decidim_conferences, :diploma_sent_at, :datetime
    add_index :decidim_conferences, :diploma_sent_at
  end
end

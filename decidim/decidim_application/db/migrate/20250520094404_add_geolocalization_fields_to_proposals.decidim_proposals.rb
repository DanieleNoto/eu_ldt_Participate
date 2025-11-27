# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class AddGeolocalizationFieldsToProposals < ActiveRecord::Migration[5.0]
  def change
    add_column :decidim_proposals_proposals, :address, :text
    add_column :decidim_proposals_proposals, :latitude, :float
    add_column :decidim_proposals_proposals, :longitude, :float
  end
end

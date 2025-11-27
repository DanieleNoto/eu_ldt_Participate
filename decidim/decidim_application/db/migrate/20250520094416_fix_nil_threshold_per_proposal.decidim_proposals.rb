# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class FixNilThresholdPerProposal < ActiveRecord::Migration[5.1]
  class Component < ApplicationRecord
    self.table_name = :decidim_components
  end

  def change
    proposal_components = Component.where(manifest_name: "proposals")

    proposal_components.each do |component|
      settings = component.attributes["settings"]
      settings["global"]["threshold_per_proposal"] ||= 0
      component.settings = settings
      component.save
    end
  end
end

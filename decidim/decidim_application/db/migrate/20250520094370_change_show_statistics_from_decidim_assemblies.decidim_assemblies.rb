# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class ChangeShowStatisticsFromDecidimAssemblies < ActiveRecord::Migration[7.0]
  def up
    change_column_default :decidim_assemblies, :show_statistics, from: false, to: true
  end

  def down
    change_column_default :decidim_assemblies, :show_statistics, from: true, to: false
  end
end

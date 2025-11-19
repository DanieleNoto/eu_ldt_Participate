# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class IndexForeignKeysInDecidimAuthorizations < ActiveRecord::Migration[5.2]
  def change
    add_index :decidim_authorizations, :unique_id
  end
end

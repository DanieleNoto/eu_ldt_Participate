# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class ChangeDefaultValueForDecidimEndorsements < ActiveRecord::Migration[6.1]
  def up
    change_column_default :decidim_endorsements, :decidim_user_group_id, 0
  end

  def down
    change_column_default :decidim_endorsements, :decidim_user_group_id, nil
  end
end

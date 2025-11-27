# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class RemoveShowInFooterInStaticPages < ActiveRecord::Migration[6.1]
  def change
    remove_column :decidim_static_pages, :show_in_footer, :boolean
  end
end

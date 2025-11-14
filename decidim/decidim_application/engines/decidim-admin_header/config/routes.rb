# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro


Decidim::AdminHeader::Engine.routes.draw do
  scope "/admin/admin_header" do
    get 'applications', to: 'applications#applications'
  end
end
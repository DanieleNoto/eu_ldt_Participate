# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro


Deface::Override.new(
  virtual_path: "layouts/decidim/admin/_application",
  name: "add_admin_header_assets",
  insert_after: "title",
  text: '<% append_stylesheet_pack_tag "decidim_admin_header_manifest", media: "all" %>
<% append_javascript_pack_tag "decidim_admin_header_manifest", defer: true %>'
)
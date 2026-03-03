# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

Deface::Override.new(
  virtual_path: "layouts/decidim/admin/_application",
  name: "add_admin_header_assets",
  insert_after: "title",
  text: '<% append_stylesheet_pack_tag "decidim_admin_header_manifest", media: "all" %>
<% append_javascript_pack_tag "decidim_admin_header_manifest", defer: true %>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">'
)

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

Deface::Override.new(
  virtual_path: "layouts/decidim/admin/_application",
  name: "insert_custom_admin_header",
  insert_top: "div.layout-wrapper",
  text: '
  <%= render partial: "layouts/decidim/ldt_header/ldt_header" %>
'
)

# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# frozen_string_literal: true

Rails.application.routes.draw do
  mount Decidim::ExtraUserFields::Engine => "/decidim-extra_user_fields"
end

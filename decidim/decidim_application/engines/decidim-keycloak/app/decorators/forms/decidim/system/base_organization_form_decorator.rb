# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Extends the System organization form to pre-populate Keycloak omniauth fields
# with ENV-based defaults when no org-specific value has been saved to the DB.
# This enables per-organization override while still showing sensible defaults.

Decidim::System::BaseOrganizationForm.prepend(Module.new do
  def map_model(model)
    super
    prefill_keycloak_defaults
  end

  private

  def prefill_keycloak_defaults
    provider_defaults = Decidim.omniauth_providers[:keycloakopenid]
    return if provider_defaults.blank?

    # Pre-fill string settings (client_id, client_secret, site, realm, icon_path)
    provider_defaults.except(:enabled).each do |key, default_value|
      next if default_value.blank?

      attr_name = :"omniauth_settings_keycloakopenid_#{key}"
      next unless respond_to?(attr_name)

      public_send(:"#{attr_name}=", default_value.to_s) if public_send(attr_name).blank?
    end

    # Pre-fill enabled (boolean) only when not explicitly set in DB
    enabled_attr = :omniauth_settings_keycloakopenid_enabled
    return unless respond_to?(enabled_attr)

    public_send(:"#{enabled_attr}=", provider_defaults[:enabled]) if public_send(enabled_attr).nil?
  end
end)

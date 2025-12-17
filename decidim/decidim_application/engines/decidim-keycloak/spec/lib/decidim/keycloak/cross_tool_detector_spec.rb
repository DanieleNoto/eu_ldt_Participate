# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require "spec_helper"

RSpec.describe Decidim::Keycloak::CrossToolDetector do
  describe ".from_same_domain?" do
    let(:current_host) { "part-int.ldttoolbox.app" }
    let(:decidim_host) { "part-int.ldttoolbox.app" }

    context "when referer is blank" do
      it "returns false" do
        expect(described_class.from_same_domain?(
                 referer: nil,
                 current_host: current_host,
                 decidim_host: decidim_host
               )).to be false
      end
    end

    context "when referer is from the same Decidim host" do
      it "returns false to avoid loops" do
        expect(described_class.from_same_domain?(
                 referer: "https://part-int.ldttoolbox.app/some/path",
                 current_host: current_host,
                 decidim_host: decidim_host
               )).to be false
      end
    end

    context "when referer is from a different subdomain on same domain" do
      it "returns true for cross-tool navigation" do
        expect(described_class.from_same_domain?(
                 referer: "https://chatbot.ldttoolbox.app/",
                 current_host: current_host,
                 decidim_host: decidim_host
               )).to be true
      end

      it "returns true for another tool subdomain" do
        expect(described_class.from_same_domain?(
                 referer: "https://analytics.ldttoolbox.app/dashboard",
                 current_host: current_host,
                 decidim_host: decidim_host
               )).to be true
      end
    end

    context "when referer is from a completely different domain" do
      it "returns false" do
        expect(described_class.from_same_domain?(
                 referer: "https://example.com/",
                 current_host: current_host,
                 decidim_host: decidim_host
               )).to be false
      end
    end

    context "when referer has invalid URI" do
      it "returns false and handles error gracefully" do
        expect(described_class.from_same_domain?(
                 referer: "not a valid uri :::",
                 current_host: current_host,
                 decidim_host: decidim_host
               )).to be false
      end
    end

    context "when decidim_host is nil" do
      it "uses current_host as fallback" do
        expect(described_class.from_same_domain?(
                 referer: "https://chatbot.ldttoolbox.app/",
                 current_host: current_host,
                 decidim_host: nil
               )).to be true
      end
    end
  end
end

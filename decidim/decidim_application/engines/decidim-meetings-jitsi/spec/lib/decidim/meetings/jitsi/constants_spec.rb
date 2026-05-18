# frozen_string_literal: true

require "rspec"
require_relative "../../../../../lib/decidim/meetings/jitsi/constants"

RSpec.describe Decidim::Meetings::Jitsi::Constants do
  describe ".normalize_server_url" do
    it "prefixes https when the host has no protocol" do
      expect(described_class.normalize_server_url("jitsi.example.com")).to eq("https://jitsi.example.com")
    end

    it "keeps https when already present" do
      expect(described_class.normalize_server_url("https://jitsi.example.com")).to eq("https://jitsi.example.com")
    end

    it "upgrades http to https" do
      expect(described_class.normalize_server_url("http://jitsi.example.com")).to eq("https://jitsi.example.com")
    end
  end
end

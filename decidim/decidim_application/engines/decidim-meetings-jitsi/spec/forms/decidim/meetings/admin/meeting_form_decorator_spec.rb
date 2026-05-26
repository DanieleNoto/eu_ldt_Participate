# frozen_string_literal: true

require "active_support/core_ext/object/blank"
require "rspec"

module Decidim
  module Meetings
    module Admin
      class MeetingForm
        def current_component
        end
      end
    end
  end
end

require_relative "../../../../../lib/decidim/meetings/jitsi/constants"
require_relative "../../../../../app/decorators/forms/decidim/meetings/admin/meeting_form_decorator"

RSpec.describe Decidim::Meetings::Admin::MeetingForm do
  subject(:form) { described_class.new }

  describe "#jitsi_server_url" do
    context "when the component setting has no protocol" do
      let(:settings) { Struct.new(:jitsi_server_url).new("jitsi.example.com") }
      let(:component) { Struct.new(:settings).new(settings) }

      before do
        allow(form).to receive(:current_component).and_return(component)
      end

      it "prefixes https" do
        expect(form.jitsi_server_url).to eq("https://jitsi.example.com")
      end
    end

    context "when the component setting already has a protocol" do
      let(:settings) { Struct.new(:jitsi_server_url).new("https://jitsi.example.com") }
      let(:component) { Struct.new(:settings).new(settings) }

      before do
        allow(form).to receive(:current_component).and_return(component)
      end

      it "keeps the configured URL" do
        expect(form.jitsi_server_url).to eq("https://jitsi.example.com")
      end
    end
  end
end

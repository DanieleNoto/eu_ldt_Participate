# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# frozen_string_literal: true

require "spec_helper"

module Decidim::Calendar
  describe EventPresenter, type: :helper do
    let(:event) { build(:external_event) }

    describe "#url" do
      subject { described_class.new(event).url }

      it { is_expected.not_to be_empty }
    end
  end
end

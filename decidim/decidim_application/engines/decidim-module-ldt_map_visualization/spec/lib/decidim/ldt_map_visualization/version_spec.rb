# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

require "spec_helper"

module Decidim
  describe LdtMapVisualization do
    subject { described_class }

    it "has version" do
      expect(subject.version).to eq("0.30.4")
    end
  end
end

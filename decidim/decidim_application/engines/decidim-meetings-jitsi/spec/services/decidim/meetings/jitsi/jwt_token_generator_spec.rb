# frozen_string_literal: true

require "spec_helper"

module Decidim
  module Meetings
    module Jitsi
      describe JwtTokenGenerator do
        subject { described_class.new(user: user, meeting: meeting, room_name: room_name) }

        let(:organization) { create(:organization) }
        let(:participatory_process) { create(:participatory_process, organization: organization) }
        let(:component) { create(:meeting_component, participatory_space: participatory_process) }
        let(:meeting) { create(:meeting, :online, component: component, online_meeting_url: "https://jitsi.example.com/test-room") }
        let(:user) { create(:user, organization: organization) }
        let(:room_name) { "test-room" }

        describe "#generate" do
          it "generates a valid JWT token" do
            token = subject.generate
            
            expect(token).to be_a(String)
            expect(token.split(".").length).to eq(3) # JWT has 3 parts
          end

          it "includes moderator claim" do
            token = subject.generate
            decoded = JWT.decode(token, ENV["OMNIAUTH_KEYCLOAK_CLIENT_SECRET"], true, { algorithm: "HS256" }).first
            
            expect(decoded["moderator"]).to be(true)
          end

          it "includes user context" do
            token = subject.generate
            decoded = JWT.decode(token, ENV["OMNIAUTH_KEYCLOAK_CLIENT_SECRET"], true, { algorithm: "HS256" }).first
            
            expect(decoded["context"]["user"]["id"]).to eq(user.id.to_s)
            expect(decoded["context"]["user"]["name"]).to eq(user.name)
            expect(decoded["context"]["user"]["email"]).to eq(user.email)
            expect(decoded["context"]["user"]["moderator"]).to eq("true")
          end

          it "includes room name" do
            token = subject.generate
            decoded = JWT.decode(token, ENV["OMNIAUTH_KEYCLOAK_CLIENT_SECRET"], true, { algorithm: "HS256" }).first
            
            expect(decoded["room"]).to eq("test-room")
          end

          it "includes correct issuer" do
            token = subject.generate
            decoded = JWT.decode(token, ENV["OMNIAUTH_KEYCLOAK_CLIENT_SECRET"], true, { algorithm: "HS256" }).first
            
            expect(decoded["iss"]).to include("realms")
            expect(decoded["iss"]).to include(ENV["OMNIAUTH_KEYCLOAK_REALM"])
          end

          it "includes correct audience" do
            token = subject.generate
            decoded = JWT.decode(token, ENV["OMNIAUTH_KEYCLOAK_CLIENT_SECRET"], true, { algorithm: "HS256" }).first
            
            audience = ENV.fetch("JWT_APP_ID", ENV.fetch("OMNIAUTH_KEYCLOAK_CLIENT_ID", "tool3"))
            expect(decoded["aud"]).to eq(audience)
          end

          it "sets expiration time to 24 hours in the future" do
            token = subject.generate
            decoded = JWT.decode(token, ENV["OMNIAUTH_KEYCLOAK_CLIENT_SECRET"], true, { algorithm: "HS256" }).first
            
            expected_exp = (Time.now + 24.hours).to_i
            expect(decoded["exp"]).to be_within(5).of(expected_exp)
          end
        end

        describe "#extract_room_name" do
          context "when room_name is provided" do
            it "uses the provided room name" do
              token = subject.generate
              decoded = JWT.decode(token, ENV["OMNIAUTH_KEYCLOAK_CLIENT_SECRET"], true, { algorithm: "HS256" }).first
              
              expect(decoded["room"]).to eq("test-room")
            end
          end

          context "when room_name is not provided" do
            subject { described_class.new(user: user, meeting: meeting) }

            it "extracts room name from meeting URL" do
              token = subject.generate
              decoded = JWT.decode(token, ENV["OMNIAUTH_KEYCLOAK_CLIENT_SECRET"], true, { algorithm: "HS256" }).first
              
              expect(decoded["room"]).to eq("test-room")
            end
          end

          context "when meeting URL has no room name" do
            let(:meeting) { create(:meeting, :online, component: component, online_meeting_url: "https://jitsi.example.com/") }
            subject { described_class.new(user: user, meeting: meeting) }

            it "generates room name from meeting ID" do
              token = subject.generate
              decoded = JWT.decode(token, ENV["OMNIAUTH_KEYCLOAK_CLIENT_SECRET"], true, { algorithm: "HS256" }).first
              
              expect(decoded["room"]).to start_with("decidim-meeting-")
              expect(decoded["room"]).to include(meeting.id.to_s)
            end
          end
        end
      end
    end
  end
end

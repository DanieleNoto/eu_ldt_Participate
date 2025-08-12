# frozen_string_literal: true

# Global route for Jitsi URL generation - simpler and more reliable
Rails.application.routes.draw do
  post "/generate-jitsi-url", to: "jitsi_url#generate", as: :generate_jitsi_url
end
# frozen_string_literal: true
Rails.application.config.after_initialize do
  Decidim::Meetings::AdminEngine.routes.draw do
    resources :meetings do
      member do
        get :generate_jitsi_url
      end
    end
  end
end
# frozen_string_literal: true

module Decidim
  module AdminHeader
    class ApplicationsController < Decidim::Admin::ApplicationController
      def keycloak_config
        # Return Keycloak configuration for frontend
        config = {
          url: ENV['OMNIAUTH_KEYCLOAK_SITE'],
          realm: ENV['OMNIAUTH_KEYCLOAK_REALM'],
          clientId: ENV['OMNIAUTH_KEYCLOAK_CLIENT_ID'],
          tool0Url: ENV['TOOL0_FULL_URL'] || 'https://ie-int.ldttoolbox.app/api/dashboard/applications/external-tools',
          tenantId: ENV['TOOL0_TENANT_ID'] || 'a6b3523b-b882-4a10-82d9-0db4dbe12f8e'
        }
        
        render json: config
      end
      
      private
      
      def get_user_jwt_token(user)
        Rails.logger.info "Getting JWT token for user #{user&.id}"
        
        # For testing/development, allow JWT token from environment
        env_jwt = ENV['TOOL0_JWT_TOKEN']
        if env_jwt.present? && env_jwt != 'your_jwt_token_here'
          Rails.logger.info "Using JWT token from environment"
          return env_jwt
        end
        
        return nil unless user
        
        Rails.logger.info "User extended_data: #{user.extended_data.inspect}"
        
        # Try to get JWT from user's extended_data (saved during Keycloak login)
        if user.extended_data && user.extended_data['keycloak_jwt_token']
          jwt_token = user.extended_data['keycloak_jwt_token']
          Rails.logger.info "Found JWT token in user extended_data for user #{user.id}"
          return jwt_token
        end
        
        Rails.logger.info "No JWT token found in extended_data for user #{user.id}"
        
        # Try to get JWT from session/cookies first
        jwt_token = session['jwt_token'] || session['id_token'] || cookies['jwt_token'] || cookies['id_token']
        if jwt_token
          Rails.logger.info "Found JWT token in session/cookies for user #{user.id}"
          return jwt_token
        end
        
        # Try to get from OAuth access tokens (if they are JWT)
        begin
          access_token = Doorkeeper::AccessToken.where(resource_owner_id: user.id)
                                                .where(revoked_at: nil)
                                                .where("expires_in IS NULL OR (created_at + INTERVAL '1 second' * expires_in) > ?", Time.current)
                                                .order(created_at: :desc)
                                                .first
          
          if access_token&.token&.include?('.')
            Rails.logger.info "Found JWT token in OAuth access token for user #{user.id}"
            return access_token.token
          end
        rescue => e
          Rails.logger.error "Error getting JWT token for user #{user.id}: #{e.message}"
        end
        
        Rails.logger.info "No JWT token found for user #{user.id}"
        nil
      end
    end
  end
end
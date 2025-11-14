# frozen_string_literal: true

# Handle application-level errors
class ErrorsController < ApplicationController
  skip_before_action :verify_authenticity_token
  
  def not_found
    render plain: 'Not Found', status: 404
  end
end

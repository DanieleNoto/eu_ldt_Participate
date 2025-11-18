# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true



# Handle application-level errors
class ErrorsController < ApplicationController
  skip_before_action :verify_authenticity_token
  
  def not_found
    render plain: 'Not Found', status: 404
  end
end
# SPDX-License-Identifier: EUPL-1.2
# Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
# See: https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12
#
# Authors:
# - Gianfranco Cedro

# frozen_string_literal: true

# Custom ActiveStorage DirectUploadsController to fix CSRF token issues
# When uploading files (like profile images), the CSRF token was being duplicated
# This controller ensures proper CSRF verification for direct uploads
module ActiveStorage
  class DirectUploadsController < ActiveStorage::BaseController
    # Use null session strategy to avoid CSRF token issues
    # Direct uploads use a pre-signed URL that's already secure
    skip_forgery_protection

    def create
      blob = ActiveStorage::Blob.create_before_direct_upload!(**blob_args)
      render json: direct_upload_json(blob)
    end

    private

    def blob_args
      params.require(:blob).permit(:filename, :byte_size, :checksum, :content_type, metadata: {}).to_h.symbolize_keys
    end

    def direct_upload_json(blob)
      blob.as_json(root: false, methods: :signed_id).merge(direct_upload: {
                                                             url: blob.service_url_for_direct_upload,
                                                             headers: blob.service_headers_for_direct_upload
                                                           })
    end
  end
end

# frozen_string_literal: true

module Decidim
  module AdminHeader
    module AssetsHelper
      def admin_header_pack_path(basename)
        # Use Shakapacker's image_pack_path helper if available (recommended)
        if respond_to?(:image_pack_path)
          begin
            return image_pack_path("media/images/#{basename}")
          rescue StandardError
            # Fall through to manual lookup
          end
        end

        manifest_path = Rails.public_path.join("decidim-packs/manifest.json")
        # Fallback path for development when manifest is missing
        fallback = "/decidim-packs/media/images/#{basename}"

        return fallback unless File.exist?(manifest_path)

        begin
          manifest = JSON.parse(File.read(manifest_path))
          # Try to find an entry whose filename starts with the basename without extension
          base_no_ext = File.basename(basename, File.extname(basename))
          manifest.each_value do |v|
            fname = File.basename(v)
            # match 'help-<hash>.svg' or exact 'help.svg'
            return v if fname.start_with?("#{base_no_ext}-") || fname == basename
          rescue StandardError
            next
          end
        rescue StandardError => e
          Rails.logger.debug { "admin_header_pack_path: could not read manifest: #{e.message}" }
        end

        fallback
      end
    end
  end
end

ActiveSupport.on_load(:action_view) { include Decidim::AdminHeader::AssetsHelper }

if Rails.env.development?
  require 'net/http'
  require 'uri'

  class ShakapackerProxy
    def initialize(app)
      @app = app
    end

    def call(env)
      request = Rack::Request.new(env)
      
      # Check if this is a request for decidim-packs assets
      if request.path.start_with?('/decidim-packs/')
        Rails.logger.debug "ShakapackerProxy: Proxying request for #{request.path}"
        begin
          # Proxy the request to shakapacker dev server
          uri = URI("http://shakapacker:3035#{request.path}")
          Rails.logger.debug "ShakapackerProxy: Proxying to #{uri}"
          http = Net::HTTP.new(uri.host, uri.port)
          http.read_timeout = 60
          
          http_request = case request.request_method
          when 'GET'
            Net::HTTP::Get.new(uri)
          when 'POST'
            Net::HTTP::Post.new(uri)
          else
            Net::HTTP::Get.new(uri)
          end
          
          # Copy headers
          request.env.each do |key, value|
            if key.start_with?('HTTP_')
              header_name = key[5..-1].tr('_', '-')
              http_request[header_name] = value unless header_name == 'HOST'
            end
          end
          
          response = http.request(http_request)
          
          # Check if response is valid and has required methods
          if response.nil? || !response.respond_to?(:each_header) || !response.respond_to?(:body) || !response.respond_to?(:code)
            Rails.logger.error "ShakapackerProxy: Invalid or incomplete response received from shakapacker server"
            return @app.call(env)
          end
          
          Rails.logger.debug "ShakapackerProxy: Got response #{response.code}"
          
          # Return the proxied response
          headers = {}
          response.each_header do |key, value|
            # Skip transfer-encoding and content-length as Rack will handle these
            unless ['transfer-encoding', 'content-length'].include?(key.downcase)
              headers[key] = value
            end
          end
          
          # Set proper content length for the response body
          body = response.body || ""
          headers['Content-Length'] = body.bytesize.to_s if body
          
          [response.code.to_i, headers, [body]]
        rescue => e
          Rails.logger.error "Shakapacker proxy error: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          # Fall back to normal Rails processing
          @app.call(env)
        end
      else
        # Pass through to Rails app
        @app.call(env)
      end
    end
  end

  Rails.application.config.middleware.insert_before ActionDispatch::Static, ShakapackerProxy
end

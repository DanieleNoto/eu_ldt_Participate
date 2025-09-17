# frozen_string_literal: true

# Matomo Analytics Injector Middleware
# This middleware injects Matomo tracking code into HTML responses
class MatomoInjector
  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, response = @app.call(env)
    
    # Only process successful HTML responses
    if status == 200 && html_response?(headers) && should_inject_matomo?
      begin
        body = extract_body(response)
        if body.include?('</head>')
          modified_body = inject_matomo_code(body)
          # Update content length
          headers['Content-Length'] = modified_body.bytesize.to_s if headers['Content-Length']
          response = [modified_body]
          
          Rails.logger.info "Matomo: Analytics code injected into HTML response"
        end
      rescue => e
        Rails.logger.error "Matomo: Error injecting code - #{e.message}"
        # Return original response on error
      end
    end

    [status, headers, response]
  end

  private

  def html_response?(headers)
    content_type = headers['Content-Type']
    content_type && content_type.include?('text/html')
  end

  def should_inject_matomo?
    # Check if Matomo is enabled and configured
    ENV['DECIDIM_ENABLE_HTML_HEADER_SNIPPETS'].present? &&
      ENV['MATOMO_URL'].present? &&
      ENV['MATOMO_SITE_ID'].present?
  end

  def extract_body(response)
    body_parts = []
    response.each { |part| body_parts << part.to_s }
    body_parts.join
  end

  def inject_matomo_code(html)
    matomo_url = ENV['MATOMO_URL'].strip
    matomo_site_id = ENV['MATOMO_SITE_ID'].strip
    
    # Ensure URL ends with /
    matomo_url = matomo_url.end_with?('/') ? matomo_url : "#{matomo_url}/"
    
    matomo_script = <<~MATOMO
    <!-- Matomo -->
    <script type="text/javascript">
      var _paq = window._paq = window._paq || [];
      /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
        var u="#{matomo_url}";
        _paq.push(['setTrackerUrl', u+'matomo.php']);
        _paq.push(['setSiteId', '#{matomo_site_id}']);
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; 
        s.parentNode.insertBefore(g,s);
      })();
    </script>
    <noscript><p><img src="#{matomo_url}matomo.php?idsite=#{matomo_site_id}&rec=1" style="border:0;" alt="" /></p></noscript>
    <!-- End Matomo Code -->
    MATOMO

    # Inject before closing </head> tag
    html.sub('</head>', "#{matomo_script}\n</head>")
  end
end

# Register the middleware
Rails.application.configure do
  config.middleware.use MatomoInjector
end

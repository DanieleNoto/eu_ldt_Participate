# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Cookie Banner Fix for Login Page
#
# This middleware injects a script that hides the cookie banner on the login page
# if the user has already accepted cookies (decidim-consent cookie is set).
#
# This fixes a bug in Decidim where the banner shows on login even after acceptance.
class CookieBannerHideFix
  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, response = @app.call(env)

    return [status, headers, response] unless should_inject?(status, headers, env)

    body = extract_body(response)
    return [status, headers, [body]] unless body.include?("</body>")

    # Inject script to hide banner if cookies already accepted
    injected_body = inject_banner_fix(body)

    if injected_body
      headers = headers.dup
      headers["Content-Length"] = injected_body.bytesize.to_s if headers["Content-Length"]
      [status, headers, [injected_body]]
    else
      [status, headers, [body]]
    end
  rescue StandardError => e
    Rails.logger.error("CookieBannerHideFix: Error - #{e.class}: #{e.message}")
    body ? [status, headers, [body]] : [status, headers, response]
  end

  private

  def should_inject?(status, headers, env)
    status == 200 &&
      html_response?(headers) &&
      is_login_page?(env["PATH_INFO"].to_s)
  end

  def html_response?(headers)
    return false unless headers && headers.respond_to?(:[])

    content_type = headers["Content-Type"]
    content_type&.include?("text/html")
  end

  def is_login_page?(path)
    path.downcase.include?("/users/sign_in")
  end

  def extract_body(response)
    return "" unless response

    body = +""
    if response.respond_to?(:each)
      response.each { |part| body << part.to_s if part }
    elsif response.respond_to?(:to_s)
      body = response.to_s
    end
    body
  ensure
    response.close if response.respond_to?(:close)
  end

  def inject_banner_fix(html)
    script = <<~JAVASCRIPT
      <script>
        (function() {
          // Hide cookie banner if cookies already accepted
          function hideBannerIfAccepted() {
            var cookieName = 'decidim-consent';
            var cookie = document.cookie.split('; ').find(row => row.startsWith(cookieName + '='));
      #{"      "}
            if (cookie) {
              try {
                var cookieValue = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
                // If any consent is accepted, hide the banner
                if (cookieValue.essential || cookieValue.preferences || cookieValue.analytics || cookieValue.marketing) {
                  // Find and hide the cookie banner
                  var banner = document.querySelector('[data-consent-bar], .cookie-bar, [class*="cookie"], [id*="cookie"]');
                  if (banner) {
                    banner.style.display = 'none';
                  }
                }
              } catch (e) {
                console.debug('Failed to parse decidim-consent cookie:', e);
              }
            }
          }
      #{"    "}
          // Run immediately and also wait for DOM to be ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideBannerIfAccepted);
          } else {
            hideBannerIfAccepted();
          }
      #{"    "}
          // Also run as mutation observer in case banner is added dynamically
          var observer = new MutationObserver(function(mutations) {
            hideBannerIfAccepted();
          });
      #{"    "}
          observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
          });
        })();
      </script>
    JAVASCRIPT

    html.sub("</body>", "#{script}\n</body>")
  end
end

Rails.application.configure do
  config.middleware.use CookieBannerHideFix
end

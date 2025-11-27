# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true

# Cookie Banner Fix for Login Page
#
# This middleware injects a script that hides the cookie banner on the login page
# if the user has already accepted cookies (cookie_consent or decidim-consent cookie is set).
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
          function getCookie(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0; i < ca.length; i++) {
              var c = ca[i];
              while (c.charAt(0) === ' ') c = c.substring(1, c.length);
              if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
          }

          function hideBannerIfAccepted() {
            // Check decidim-consent cookie
            var consentCookie = getCookie('decidim-consent');
            var hasAcceptedCookies = false;

            if (consentCookie) {
              try {
                var decoded = decodeURIComponent(consentCookie);
                var cookieValue = JSON.parse(decoded);
                // If essential consent is accepted, hide the banner
                if (cookieValue.essential === true) {
                  hasAcceptedCookies = true;
                }
              } catch (e) {
                // If parsing fails, check if it's just 'true'
                if (consentCookie === 'true' || decoded === 'true') {
                  hasAcceptedCookies = true;
                }
              }
            }

            if (hasAcceptedCookies) {
              // Find and hide the cookie banner with multiple selectors
              var selectors = [
                '[data-consent]',
                '[data-consent-bar]',#{" "}
                '.cookie-bar',
                '.cookie-banner',
                '.cookies-eu',
                '[class*="cookie"][class*="banner"]',
                '[id*="cookie"][id*="banner"]',
                '[data-cookies]'
              ];
      #{"        "}
              selectors.forEach(function(selector) {
                var elements = document.querySelectorAll(selector);
                elements.forEach(function(element) {
                  element.style.display = 'none';
                  element.style.visibility = 'hidden';
                  element.setAttribute('hidden', 'true');
                });
              });
      #{"        "}
              console.debug('Cookie banner hidden - consent already given');
            }
          }
      #{"    "}
          // Run immediately
          hideBannerIfAccepted();
      #{"    "}
          // Run on DOM ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideBannerIfAccepted);
          }
      #{"    "}
          // Also run as mutation observer in case banner is added dynamically
          var observer = new MutationObserver(function(mutations) {
            hideBannerIfAccepted();
          });
      #{"    "}
          if (document.body) {
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
          } else {
            // Body not ready yet, wait for it
            document.addEventListener('DOMContentLoaded', function() {
              observer.observe(document.body, {
                childList: true,
                subtree: true
              });
            });
          }
        })();
      </script>
    JAVASCRIPT

    html.sub("</body>", "#{script}\n</body>")
  end
end

Rails.application.configure do
  config.middleware.use CookieBannerHideFix
end

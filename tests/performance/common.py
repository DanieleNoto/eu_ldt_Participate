# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Simone Bianchelli
#

import base64
import hashlib
import os
import json
import re
import secrets
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse
from locust import HttpUser
from contextlib import contextmanager
import requests

# Cache for parsed JSON config to avoid re-reading on every call
_json_config_cache = None

def load_json_config(path: str):
    global _json_config_cache
    if _json_config_cache is not None:
        return _json_config_cache
    try:
        with open(path, "r", encoding="utf-8") as f:
            _json_config_cache = json.load(f)
    except FileNotFoundError:
        raise RuntimeError(f"Configuration file not found: {path}")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid JSON in config file {path}: {e}")
    return _json_config_cache

class AuthenticatedUser(HttpUser):
    """
    Base user that handles OAuth2 authentication via Keycloak with PKCE flow.
    Session-based authentication using cookies.
    
    All settings (KEYCLOAK_HOST, CLIENT_ID/SECRET, credentials, etc.) are loaded from
    the JSON configuration file specified by LOCUST_CONFIG_FILE environment variable,
    or defaults to 'locust_config.json'.
    """
    # Required to prevent execution errors in child classes that don't define tasks
    abstract = True

    def get_setting(self, name: str, default=None):
        config_path = os.getenv("LOCUST_CONFIG_FILE", "locust_config.json")
        json_conf = load_json_config(config_path)
        return json_conf.get(name, default)

    def on_start(self):
        # Load credentials and client info from config (defaults are fallbacks if JSON is incomplete)
        self.client_id = self.get_setting("KEYCLOAK_CLIENT_ID")
        self.client_secret = self.get_setting("KEYCLOAK_CLIENT_SECRET")
        self.username = self.get_setting("AUTH_USERNAME")
        self.password = self.get_setting("AUTH_PASSWORD")
        self.auth_host = self.get_setting("KEYCLOAK_HOST")
        self.auth_redirect_uri = self.get_setting("KEYCLOAK_REDIRECT_URI", self.host)
        self.auth_callback_path = self.get_setting("KEYCLOAK_CALLBACK_PATH", "/users/auth/keycloakopenid/callback")
        
        # Authenticate to obtain access and refresh tokens
        self.set_token_via_authorization_code()

        # Retrieve initial CSRF token
        self.update_csrf_token()

    def refresh(self):
        """
        Re-authenticate using full OAuth2 flow when session expires.
        Note: Session-based authentication doesn't support traditional token refresh.
        """
        print("[locust][INFO] Session expired, re-authenticating...")
        self.set_token_via_authorization_code()

    def update_csrf_token(self):
        """
        Attempt to fetch CSRF token from /api/v1/csrf-token endpoint.
        CSRF token is optional - if unavailable, requests will continue without it.
        Uses requests library to exclude from performance statistics.
        """
        try:
            # Use requests library instead of Locust client to exclude from stats
            response = requests.get(
                f"{self.host}/api/v1/csrf-token",
                headers={"Accept": "application/json"},
                cookies=self.client.cookies,
                verify=True
            )
            
            if response.status_code != 200:
                print(f"[locust][WARN] CSRF endpoint returned {response.status_code} - continuing without CSRF")
                return

            token = None
            try:
                js = response.json()
                if isinstance(js, dict):
                    token = js.get("csrfToken") or js.get("csrf_token") or js.get("token")
                    if not token and "data" in js and isinstance(js["data"], dict):
                        token = js["data"].get("csrfToken") or js["data"].get("csrf_token")
            except ValueError:
                print("[locust][DEBUG] CSRF endpoint response was not valid JSON")

            if not token:
                token = response.headers.get("x-csrf-token")

            if token:
                self.csrf_token = token
                self.client.headers.update({"x-csrf-token": token})
                print(f"[locust][INFO] CSRF token updated successfully")
            else:
                print("[locust][WARN] CSRF token not found - continuing without it")
        except Exception as e:
            print(f"[locust][WARN] Failed to fetch CSRF token: {e} - continuing without it")

    def generate_code_verifier(self, length=64):
        """Generate a secure random URL-safe string for PKCE"""
        verifier = base64.urlsafe_b64encode(os.urandom(length)).rstrip(b'=')
        return verifier.decode('utf-8')

    def create_code_challenge(self, verifier):
        """Create code challenge from verifier for PKCE"""
        digest = hashlib.sha256(verifier.encode('utf-8')).digest()
        challenge = base64.urlsafe_b64encode(digest).rstrip(b'=')
        return challenge.decode('utf-8')

    def get_new_state(self):
        """Generate a random state parameter for OAuth2"""
        return secrets.token_urlsafe(16)
    
    def extract_csrf_token_from_html(self, html_content):
        """
        Extract CSRF token from Rails/Decidim HTML meta tag.
        Searches for: <meta name="csrf-token" content="TOKEN_VALUE" />
        """
        csrf_pattern = r'<meta\s+name=["\']csrf-token["\']\s+content=["\'](.*?)["\']'
        match = re.search(csrf_pattern, html_content)
        if match:
            return match.group(1)
        return None

    def set_token_via_authorization_code(self):
        """
        Perform OAuth2 Authorization Code flow with PKCE to obtain tokens.
        Sets both Authorization header and cookies for compatibility with different endpoints.
        """
        print("[locust][INFO] Starting OAuth2 Authorization Code flow...")
        
        state = self.get_new_state()
        code_verifier = self.generate_code_verifier()
        code_challenge = self.create_code_challenge(code_verifier)
        
        auth_query_params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": f"{self.auth_redirect_uri}{self.auth_callback_path}",
            "scope": "openid profile email",
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }

        # Step 1: Get authorization page (using requests library to exclude from stats)
        print("[locust][INFO] Step 1: Getting authorization page from Keycloak...")
        response = requests.get(
            f"{self.auth_host}/realms/LDT/protocol/openid-connect/auth",
            params=auth_query_params,
            allow_redirects=True,
            verify=True
        )
        if response.status_code != 200:
            raise RuntimeError(f"Failed to get authorization page: {response.status_code}")
        
        html_content = response.text

        # Extract login action URL from HTML
        login_action_pattern = r'"loginAction":\s*"([^"]*)"'
        match = re.search(login_action_pattern, html_content)
        if not match:
            raise ValueError("Login action URL not found in Keycloak HTML response")
        
        login_action_url = match.group(1).replace('&amp;', '&')
        
        # Step 2: Submit credentials (using requests library to exclude from stats)
        print("[locust][INFO] Step 2: Submitting credentials to Keycloak...")
        authenticate_response = requests.post(
            login_action_url,
            data={
                "username": self.username,
                "password": self.password,
                "credentialId": ''
            },
            cookies=response.cookies,
            allow_redirects=False,
            verify=True
        )
        
        # Keycloak will return 302/303 redirect to the callback URL
        if authenticate_response.status_code not in [302, 303]:
            print(f"[locust][ERROR] Expected redirect (302/303), got {authenticate_response.status_code}")
            print(f"[locust][ERROR] Response: {authenticate_response.text[:500]}")
            raise Exception(f"Login failed: expected redirect, got {authenticate_response.status_code}")
        
        # Get the redirect location (should be to our app's /auth/callback)
        redirect_url = authenticate_response.headers.get('Location')
        if not redirect_url:
            raise Exception("No redirect location in authentication response")
        
        # Step 3: Follow redirect to get authorization code
        print("[locust][INFO] Step 3: Following OAuth callback redirect...")
        
        # Handle both absolute and relative redirect URLs
        if redirect_url.startswith('http'):
            parsed_redirect = urlparse(redirect_url)
        else:
            redirect_url = f"{self.auth_redirect_uri}{redirect_url}"
            parsed_redirect = urlparse(redirect_url)
        
        # Extract code from redirect URL
        callback_params = parse_qs(parsed_redirect.query)
        code = callback_params.get("code", [None])[0]
        
        if not code:
            raise Exception(f"Authorization code not found in redirect URL: {redirect_url}")
        
        # Follow the redirect to trigger Decidim's OAuth callback handler (using requests library)
        # This creates the session cookie which is used for authentication
        callback_response = requests.get(
            redirect_url,
            cookies=authenticate_response.cookies,
            allow_redirects=True,
            verify=True
        )
        
        if callback_response.status_code != 200:
            raise Exception(f"Callback failed with status {callback_response.status_code}")
        
        # Transfer all cookies from requests session to Locust client
        for cookie in callback_response.cookies:
            self.client.cookies.set(cookie.name, cookie.value, domain=cookie.domain, path=cookie.path)
        
        # Verify session cookie was obtained
        cookies = self.client.cookies.get_dict()
        if not ("_session_id" in cookies or "_decidim_session" in cookies):
            raise Exception(f"No session cookie obtained after callback. Available: {list(cookies.keys())}")
        
        # Extract CSRF token from the callback response HTML
        csrf_token = self.extract_csrf_token_from_html(callback_response.text)
        if csrf_token:
            self.csrf_token = csrf_token
            self.client.headers.update({"X-CSRF-Token": csrf_token})
            print(f"[locust][INFO] CSRF token extracted from HTML: {csrf_token[:20]}...")
        else:
            print("[locust][WARN] Could not extract CSRF token from HTML - will try to fetch from endpoint")
        
        # Store token expiration time for session management
        self.access_token_expires_at = datetime.now() + timedelta(hours=1)
        
        print(f"[locust][INFO] Authentication completed successfully! Cookies: {list(cookies.keys())}")
    
    @contextmanager
    def catch_401(self, request_func, *args, **kwargs):
        """
        Context manager that wraps HTTP requests with automatic auth recovery.
        
        Features:
        - Preemptive session refresh if expiring within 30 seconds
        - Re-authenticate on 401 (Unauthorized)
        - Update CSRF token on 403 (Forbidden)
        - Prevents infinite retry loops
        
        Usage:
            with self.catch_401(self.client.post, url, json=payload, name="...") as resp:
                # handle response
        """
        tried_login = False
        tried_csrf = False
        
        # Preemptive session refresh if expiring soon
        if hasattr(self, 'access_token_expires_at') and \
           datetime.now() > (self.access_token_expires_at - timedelta(seconds=30)):
            print("[locust][INFO] Session expiring soon, refreshing preemptively...")
            self.refresh()
            self.update_csrf_token()
        
        with request_func(*args, **kwargs) as resp:
            # Handle 401 - session might be invalid
            if resp.status_code == 401 and not tried_login:
                tried_login = True
                print("[locust][WARN] Received 401, re-authenticating...")
                self.refresh()
            
            # Handle 403 - might be CSRF issue
            if resp.status_code == 403 and not tried_csrf:
                tried_csrf = True
                print("[locust][WARN] Received 403, updating CSRF token...")
                self.update_csrf_token()
            
            yield resp
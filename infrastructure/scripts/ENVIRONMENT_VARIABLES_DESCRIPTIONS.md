# Environment Variables Descriptions

This document provides descriptions for all environment variables used in the EU LDT Participate platform. Descriptions are provided in British English.

## Chatbot Variables

### CHATBOT-BACKEND-URL

The base URL for the chatbot backend API service. Used by the frontend to communicate with the backend service. Format: `http://chatbot-backend-svc:3002` or `https://api.example.com`.

### CHATBOT-FROM-EMAIL

Email address used as the sender for chatbot-generated emails (e.g., support requests, notifications). This appears in the "From" field of emails sent by the chatbot service.

### CHATBOT-SUPPORT-EMAIL

Email address where support requests from the chatbot are sent. This is the recipient address for user support inquiries submitted through the chatbot interface.

### CHATBOT-URL

The public URL of the chatbot frontend service. Used by Decidim to embed or link to the chatbot interface. Format: `http://chatbot-frontend-svc` or `https://chatbot.example.com`.

## Container Configuration

### CONTAINER_IMAGE_TOOL_TAG

Docker container image tag version used for deploying services (e.g., `v1.0.0`). This tag identifies the specific version of container images to pull from the container registry (e.g., Azure Container Registry).

## CORS Configuration

### CORS-ORIGINS

Comma-separated list of allowed origins for Cross-Origin Resource Sharing (CORS). Specifies which domains are permitted to make requests to the chatbot backend API. Format: `http://localhost:3000,https://example.com`.

## Encryption Configuration

### CYPHER-SALT

Cryptographic salt used for encryption/decryption operations in the chatbot backend. Must be a random string used to enhance the security of encrypted data.

### CYPHER-SECRET

Secret key used for encryption/decryption operations in the chatbot backend. Used with the cipher algorithm (typically AES-256-CTR) to encrypt sensitive data such as user messages or tokens.

## Database Configuration

### DATABASE-HOST

Hostname or IP address of the PostgreSQL database server used by Decidim. Can be a service name in Kubernetes (e.g., `db`) or a hostname/IP address.

### DATABASE-NAME

Name of the PostgreSQL database used by Decidim for storing application data. Example: `decidim_application_development` or `decidim_application_production`.

### DATABASE-PASSWORD

Password for authenticating to the Decidim PostgreSQL database. Stored as a Kubernetes secret for security.

### DATABASE-URL

Full PostgreSQL connection string for the chatbot backend database. Format: `postgresql://username:password@host:port/database`. This can be used instead of individual database connection parameters.

### DATABASE-USERNAME

Username for authenticating to the Decidim PostgreSQL database. Example: `postgres`.

### DB-NAME

Name of the PostgreSQL database used by the chatbot backend service. Example: `chatbot_db`.

### DB-PASSWORD

Password for authenticating to the chatbot backend PostgreSQL database.

### DB-USERNAME

Username for authenticating to the chatbot backend PostgreSQL database.

## Decidim Configuration

### DECIDIM-AVAILABLE-LOCALES

Comma-separated list of language codes available in the Decidim platform. Determines which languages users can select. Example: `en,es,fr,de`.

### DECIDIM-DEFAULT-LOCALE

Default language code used by Decidim when no user preference is set. Must be one of the languages listed in `DECIDIM-AVAILABLE-LOCALES`. Example: `en`.

### DECIDIM-HOST

Public hostname or domain name of the Decidim application. Used to generate absolute URLs and configure the application domain. Example: `part-int.ldttoolbox.app`.

### DECIDIM-JITSI-URL

Base URL for the Jitsi Meet video conferencing service integrated with Decidim meetings. Example: `jitsi-part-int.ldttoolbox.app`.

### DECIDIM-LOGO-URL

URL pointing to the organisation's logo image file. Used to customise the branding displayed in the chatbot interface and emails.

### DECIDIM-MAILER-SENDER

Email address used as the sender for all emails sent by Decidim. Appears in the "From" field of system emails. Example: `info@ldttoolbox.eu`.

### DECIDIM-ORGANIZATION-NAME

Name of the organisation using the Decidim platform. Displayed in the chatbot interface and other integrated services.

### DECIDIM-PRIMARY-COLOR

Primary brand colour used in the Decidim interface, specified as a hexadecimal colour code. Example: `#1976d2`.

### DECIDIM-THROTTLING-MAX-REQUESTS

Maximum number of requests allowed per time window for rate limiting/throttling in Decidim. Helps prevent abuse and ensures fair resource usage. Example: `500`.

## Logging Configuration

### ENABLE-JSON-LOGS

Boolean flag to enable JSON-formatted logs instead of plain text. Useful for log aggregation systems. Set to `true` to enable JSON logging.

## Grafana Configuration (GF-\*)

### GF-AUTH-GENERIC-OAUTH-ALLOW-ASSIGN-GRAFANA-ADMIN

Boolean flag to allow OAuth users to be assigned Grafana admin roles based on their role attributes from the OAuth provider (e.g., Keycloak).

### GF-AUTH-GENERIC-OAUTH-ALLOW-SIGN-UP

Boolean flag to allow new user sign-ups via OAuth. When enabled, users authenticating through OAuth who don't have a Grafana account will have one created automatically.

### GF-AUTH-GENERIC-OAUTH-API-URL

URL of the OAuth provider's user information endpoint. Used to fetch user details after authentication. Example: `https://im-int.ldttoolbox.app/realms/LDT/protocol/openid-connect/userinfo`.

### GF-AUTH-GENERIC-OAUTH-AUTH-URL

URL of the OAuth provider's authorisation endpoint. Used to initiate the OAuth authentication flow. Example: `https://im-int.ldttoolbox.app/realms/LDT/protocol/openid-connect/auth`.

### GF-AUTH-GENERIC-OAUTH-CLIENT-ID

OAuth client ID registered in the OAuth provider (e.g., Keycloak) for Grafana authentication.

### GF-AUTH-GENERIC-OAUTH-CLIENT-SECRET

OAuth client secret corresponding to the client ID. Used to authenticate Grafana with the OAuth provider. Stored as a Kubernetes secret.

### GF-AUTH-GENERIC-OAUTH-EMAIL-ATTRIBUTE-PATH

JSONPath expression to extract the email address from the OAuth provider's user information response. Example: `email`.

### GF-AUTH-GENERIC-OAUTH-GROUPS-ATTRIBUTE-PATH

JSONPath expression to extract user groups from the OAuth provider's user information response. Used for role mapping. Example: `groups`.

### GF-AUTH-GENERIC-OAUTH-LOGIN-ATTRIBUTE-PATH

JSONPath expression to extract the username/login identifier from the OAuth provider's user information response. Example: `login`.

### GF-AUTH-GENERIC-OAUTH-NAME

Display name for the OAuth provider in Grafana's login interface. Example: `Keycloak`.

### GF-AUTH-GENERIC-OAUTH-NAME-ATTRIBUTE-PATH

JSONPath expression to extract the user's display name from the OAuth provider's user information response. Example: `name`.

### GF-AUTH-GENERIC-OAUTH-ROLE-ATTRIBUTE-PATH

JSONPath expression used to map OAuth user roles to Grafana roles (Viewer, Editor, Admin). Can include conditional logic. Example: `contains(roles[*], 'admin') && 'Admin' || contains(roles[*], 'editor') && 'Editor'`.

### GF-AUTH-GENERIC-OAUTH-SCOPES

Space-separated list of OAuth scopes requested during authentication. Example: `openid email profile offline_access roles`.

### GF-AUTH-GENERIC-OAUTH-SIGNOUT-REDIRECT-URL

URL to redirect users to after signing out from Grafana. Typically points to the OAuth provider's logout endpoint with a redirect parameter. Example: `https://im-int.ldttoolbox.app/realms/LDT/protocol/openid-connect/logout?post_logout_redirect_uri=...`.

### GF-AUTH-GENERIC-OAUTH-TOKEN-URL

URL of the OAuth provider's token endpoint. Used to exchange authorisation codes for access tokens. Example: `https://im-int.ldttoolbox.app/realms/LDT/protocol/openid-connect/token`.

### GF-DATABASE-HOST

Hostname or IP address of the PostgreSQL database server used by Grafana for storing dashboards, users, and other data.

### GF-DATABASE-NAME

Name of the PostgreSQL database used by Grafana.

### GF-DATABASE-PASSWORD

Password for authenticating to the Grafana PostgreSQL database. Stored as a Kubernetes secret.

### GF-DATABASE-TYPE

Database type used by Grafana for storage. Typically `postgres` for PostgreSQL databases.

### GF-DATABASE-USER

Username for authenticating to the Grafana PostgreSQL database.

### GF-SECURITY-ADMIN-PASSWORD

Password for the Grafana administrator account. Used for initial setup and local admin access. Stored as a Kubernetes secret.

### GF-SECURITY-ADMIN-USER

Username for the Grafana administrator account. Typically `admin`.

### GF-SERVER-DOMAIN

Domain name where Grafana is accessible. Used for constructing URLs and configuring cookie domains. Example: `part-int.ldttoolbox.app/analytics/grafana`.

### GF-SERVER-ROOT-URL

Full root URL where Grafana is publicly accessible, including protocol and path. Example: `https://part-int.ldttoolbox.app/analytics/grafana`.

### GF-SERVER-SERVE-FROM-SUB-PATH

Boolean flag indicating whether Grafana is served from a sub-path rather than the root domain. Required when Grafana is accessed via a path like `/analytics/grafana`.

## External URLs

### HELP-URL

URL pointing to help documentation or support resources. Used in the Decidim interface to link users to help content. Example: `https://interoperable-europe.ec.europa.eu/collection/ldttoolbox`.

## Jitsi Configuration

### JICOFO-AUTH-PASSWORD

Password for authenticating the Jitsi Conference Focus (Jicofo) component with the Prosody XMPP server. Used for internal Jitsi service communication.

### JVB-AUTH-PASSWORD

Password for authenticating the Jitsi Video Bridge (JVB) component with the Prosody XMPP server. Used for internal Jitsi service communication.

### JVB-STUN-SERVERS

Comma-separated list of STUN server addresses used by Jitsi Video Bridge for NAT traversal. Example: `stun.l.google.com:19302,stun1.l.google.com:19302`.

### JWT-ACCEPTED-AUDIENCES

Comma-separated list of accepted JWT token audiences for Jitsi authentication. Must match the audience claim in tokens issued by Keycloak. Example: `tool3`.

### JWT-ACCEPTED-ISSUERS

Comma-separated list of accepted JWT token issuers for Jitsi authentication. Typically the Keycloak realm URL. Example: `https://im-int.ldttoolbox.app/realms/LDT`.

### JWT-APP-ID

Application identifier (client ID) used in JWT tokens for Jitsi authentication. Must match the Keycloak client ID configured for Jitsi.

### JWT-APP-SECRET

Secret key used to verify JWT tokens for Jitsi authentication. Must match the client secret configured in Keycloak for the Jitsi application. Stored as a Kubernetes secret.

## Keycloak/OmniAuth Configuration

### KEYCLOAK-DISABLE-SSL-VERIFY

Boolean flag to disable SSL certificate verification when connecting to Keycloak. Should be `false` in production. Set to `true` only for development with self-signed certificates.

### OMNIAUTH-KEYCLOAK-CLIENT-ID

OAuth client ID registered in Keycloak for Decidim authentication. Used by the OmniAuth Keycloak provider.

### OMNIAUTH-KEYCLOAK-CLIENT-SECRET

OAuth client secret corresponding to the Keycloak client ID. Used to authenticate Decidim with Keycloak. Stored as a Kubernetes secret.

### OMNIAUTH-KEYCLOAK-REALM

Name of the Keycloak realm used for Decidim authentication. Example: `LDT`.

### OMNIAUTH-KEYCLOAK-SITE

Base URL of the Keycloak server. Used to construct authentication endpoints. Example: `https://im-int.ldttoolbox.app/`.

## Matomo Configuration

### MATOMO-DATABASE-DBNAME

Name of the MySQL/MariaDB database used by Matomo for storing analytics data. Example: `matomo`.

### MATOMO-DATABASE-HOST

Hostname or IP address of the MySQL/MariaDB database server used by Matomo.

### MATOMO-DATABASE-PASSWORD

Password for authenticating to the Matomo MySQL/MariaDB database. Stored as a Kubernetes secret.

### MATOMO-DATABASE-USERNAME

Username for authenticating to the Matomo MySQL/MariaDB database.

### MATOMO-ROOT-URL

Full root URL where Matomo is publicly accessible, including protocol and path. Example: `https://part-int.ldttoolbox.app/analytics/matomo/`.

### MATOMO-SERVER-ADDRESS

Base URL of the Matomo analytics server. Used by Decidim to send tracking data. Example: `https://part-int.ldttoolbox.app/analytics/matomo/`.

### MATOMO-SITE-ID

Unique identifier for the Matomo site being tracked. Used to associate tracking data with the correct site in Matomo.

### MATOMO-TOKEN-AUTH

Authentication token for the Matomo API. Used to authenticate API requests from Decidim to Matomo. Stored as a Kubernetes secret.

## Performance Monitoring

### MAX-EVENT-LOOP-USE

Maximum event loop utilisation threshold for the chatbot backend (0.0 to 1.0). When exceeded, the service returns HTTP 503. Example: `0.98` (98% utilisation).

## Meeting Configuration

### MEETINGS-EMBEDDABLE-SERVICES

Space-separated list of domains allowed for embedding meeting services in Decidim. Used for Content Security Policy configuration. Example: `jitsi-part-int.ldttoolbox.app www.youtube.com www.twitch.tv meet.jit.si`.

## MySQL Configuration (for Matomo)

### MYSQL-DATABASE

Name of the MySQL/MariaDB database. Typically matches `MATOMO-DATABASE-DBNAME`.

### MYSQL-PASSWORD

Password for the MySQL/MariaDB database user. Stored as a Kubernetes secret.

### MYSQL-ROOT-PASSWORD

Password for the MySQL/MariaDB root user. Used for initial database setup. Stored as a Kubernetes secret.

### MYSQL-USER

Username for the MySQL/MariaDB database user. Typically matches `MATOMO-DATABASE-USERNAME`.

## External Tool URLs

### NOTIFICATION-PREFERENCES-URL

URL pointing to the page where users can manage their notification preferences. Used in email footers and chatbot notifications.

## PostgreSQL Configuration

### POSTGRES-DATABASE

Name of the PostgreSQL database. Can be used as an alternative to `DATABASE-NAME` or `DB-NAME` depending on context.

### POSTGRES-DB

Alternative name for PostgreSQL database name. Some PostgreSQL images use this environment variable.

### POSTGRES-PASSWORD

Password for the PostgreSQL database user. Stored as a Kubernetes secret.

### POSTGRES-USER

Username for the PostgreSQL database user. Example: `postgres`.

## Privacy and Policy URLs

### PRIVACY-POLICY-URL

URL pointing to the privacy policy document. Used in email footers and chatbot interfaces to provide privacy information to users.

### PUBLIC-URL

Public URL of the Jitsi Meet service. Used to construct meeting room URLs and for public access. Example: `https://jitsi-part-int.ldttoolbox.app/`.

## Queue Configuration

### QUEUE-ADAPTER

Background job queue adapter used by Decidim. Common values: `sidekiq` (production), `async` (development). Determines how background jobs are processed.

## Rails Configuration

### RAILS-ASSET-HOST

Base URL for serving Rails assets (CSS, JavaScript, images). Used for CDN configuration or custom asset hosting. Example: `https://part-int.ldttoolbox.app`.

### RAILS-LOG-LEVEL

Logging verbosity level for Rails. Common values: `debug`, `info`, `warn`, `error`. Controls the amount of detail in application logs.

## Rate Limiting

### RATE-LIMIT-MAX

Maximum number of requests allowed per time window for the chatbot backend API rate limiting. Example: `100`.

### RATE-LIMIT-TIME-WINDOW

Time window duration for rate limiting in the chatbot backend. Format: human-readable duration (e.g., `1 minute`, `15 minutes`).

## Redis Configuration

### REDIS-URL

Full Redis connection URL used by Decidim for caching, sessions, and background job queues. Format: `redis://host:port/database`. Example: `redis://redis:6379/0`.

## Container Configuration

### RESTART-POLICY

Docker container restart policy. Common values: `unless-stopped`, `always`, `on-failure`. Determines when containers should be automatically restarted.

## Security

### SECRET-KEY-BASE

Secret key used by Rails for encrypting and signing cookies, sessions, and other sensitive data. Must be a long, random string. Generated using `rails secret` command. Stored as a Kubernetes secret.

## SMTP Configuration

### SMTP-ADDRESS

Hostname or IP address of the SMTP server used for sending emails. Example: `smtp.gmail.com`.

### SMTP-AUTHENTICATION

Authentication method used for SMTP. Common values: `plain`, `login`, `cram_md5`. Example: `plain`.

### SMTP-DOMAIN

Domain name used for SMTP HELO/EHLO command. Typically the domain of your application or email service. Example: `gmail.com` or `ldttoolbox.app`.

### SMTP-ENABLE-STARTTLS-AUTO

Boolean flag to automatically enable STARTTLS when available. Enhances email security by upgrading the connection to TLS. Set to `true` for secure email transmission.

### SMTP-OPEN-TIMEOUT

Timeout in seconds for establishing a connection to the SMTP server. Example: `120`.

### SMTP-PASSWORD

Password for authenticating to the SMTP server. Stored as a Kubernetes secret.

### SMTP-PORT

Port number for the SMTP server. Common values: `587` (STARTTLS), `465` (SSL/TLS), `25` (unencrypted). Example: `587`.

### SMTP-READ-TIMEOUT

Timeout in seconds for reading responses from the SMTP server. Example: `120`.

### SMTP-TLS

Boolean flag to use TLS/SSL for SMTP connections. Set to `true` for port 465, `false` for port 587 with STARTTLS.

### SMTP-USER-NAME

Username for authenticating to the SMTP server. Can be an email address or a username depending on the provider.

### SMTP-USERNAME

Alternative name for SMTP username. Used interchangeably with `SMTP-USER-NAME` depending on the application context.

## External Tool Integration (TOOL0-\*)

### TOOL0-API-TOOLBAR-APPLICATIONS

API endpoint path for fetching external toolbar applications from Tool0 (LDT Toolbox Integration service). Used to display integrated tools in the Decidim interface. Example: `/api/dashboard/applications/external-tools`.

### TOOL0-DOMAIN

Base domain URL of Tool0 (LDT Toolbox Integration service). Used for constructing API endpoints and iframe URLs. Example: `https://ie-int.ldttoolbox.app`.

### TOOL0-FULL-URL

Complete URL for the Tool0 external applications API endpoint. Used to fetch the list of available integrated tools. Example: `https://ie-int.ldttoolbox.app/api/dashboard/applications/external-tools`.

## External Tool Integration (TOOL1-\*)

### TOOL1-MAPS-URL

API endpoint URL for Tool1 (Map Visualisation service) used to fetch map data. Example: `https://pv-int.ldttoolbox.app/api/maps`.

## External Tool Integration (TOOL2-\*)

### TOOL2-EXPERIMENTS-URL

API endpoint URL for Tool2 (Use Case Scenarios service) used to fetch experiment data. Example: `https://ucs-int.ldttoolbox.app/api/v1/experiments`.

### TOOL2-IFRAME-URL

URL for embedding Tool2 experiment execution interface as an iframe in Decidim. Example: `https://ucs-int.ldttoolbox.app/embed/experiment-execution`.

## Frontend Configuration

### VITE-API-URL

Base URL of the chatbot backend API used by the Vite-based frontend application. Used for API requests from the browser. Example: `http://chatbot-backend-svc:3002` or `https://api.example.com/api/v1`.

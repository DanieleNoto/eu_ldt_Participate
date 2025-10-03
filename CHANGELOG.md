# Changelog from D03.04.Sep to HEAD

## feat

- updated [PAR-MACT001] ��� Send mass email communications
- merge main into PAR-DE/PAR-DE001
- updated [PAR-MACT001] ��� Send mass email communications
- added download of the file in all formats and downloadExportFile function
- renamed the function to more generic downloadExportFile
- updated [PAR-DE002] ��� Export debate data
- [PAR-DE002] ��� Export debate data
- refactor configurations
- move gem jitsi under engines and refactor build
- [PAR-DE001] ��� Export survey answers
- add Kubernetes tasks to apply Matomo and Grafana secrets, update secret values for consistency
- add Kubernetes task to apply Grafana secrets in build and deployment pipeline
- removed timeouts from NewsletterAdminPage.ts
- enhance build and deployment pipeline for Tool3 with updated Kubernetes tasks and configurations
- update Grafana and Matomo configurations, add StatefulSets and services
- fixed comments PR 1543
- add JWT_APP_SECRET to Jitsi secrets configuration
- [PAR-MACT001] ��� Send mass email communications
- add custom styles for rich text links in application stylesheet
- update Grafana and Jitsi configurations for improved database handling and WebSocket support
- fixed SonarQube warnings - PR 1543
- update custom admin header to improve layout structure
- [PAR-CP004] ��� Citizen invitation to participate in a private process
- add new fork of module updated to decidim 0.30.1
- implement API service for fetching external tools applications
- enhance tools dropdown functionality and styling
- enhance application group rendering and toggle functionality
- update Gemfile.lock with dependency version bumps
- implement tools dropdown and applications loading functionality
- init engine for tool0 header
- fixed comment PR 1504
- fixed comments of PR 1504
- fixed comments of PR 1504
- fixing conflict of SurveysManagePage.ts file
- [PAR-PAS005] ��� Review result of specific surveys
- restructure build and deployment pipeline for Tool3 with enhanced Kubernetes configurations
- enhance Kubernetes deployment configuration for Decidim, Jitsi, and Matomo services
- add system user creation and admin assignment in test database preparation
- add localization files for privacy policy in German, Spanish, French, and update English translations
- remove deprecated DecidimAwesome configuration script
- refactor docker-compose
- update database connection pool settings and add timeout; adjust development log level and enable query log tags; enhance shakapacker asset watching configuration
- [PAR-PAS004] ��� Reply to a survey
- merge main into PAR-PAS/PAR-PAS003
- remove unused import and variable from PAR-PAS002 and PAR-PAS003
- update Dockerfile and docker-compose configurations for improved build efficiency and dependency management
- updated [PAR-PAS002] ��� Create single question polls
- updated [PAR-PAS003] ��� Create detailed surveys with configurable options
- implement variable tokenization and secrets management across Grafana, Matomo, Decidim, and Jitsi configurations
- updated [PAR-PAS003] ��� Create detailed surveys with configurable options
- update ingress configurations for platform components with new routing rules and host adjustments
- improve user creation logic in prepare-db-for-tests script to skip in development environment
- added missing empty fields verification also for alternative fields
- enhance Kubernetes deployment configurations for Grafana, Matomo, Decidim, and Jitsi applications with resource limits and security improvements
- fixed comments for PR 1159
- update build and deployment pipeline for Decidim, Jitsi, and Matomo applications, including ACR secret management and resource configurations
- fixed PR 1159 comments
- update yarn.lock
- add Kubernetes scripts and ingress configurations for Decidim, Matomo, Grafana, and Jitsi Meet deployment
- add Kubernetes configuration for Jitsi Meet deployment, including deployments, services, ingress, and persistent volume claims
- updated PAR-PAS003 - Create detailed surveys with configurable options
- updated PAR-PAS002 - Create single-question polls
- implemented [PAR-PAS003] ��� Create detailed surveys with configurable options
- enhance Dockerfile and entrypoint for asset management and user creation, update Gemfile for mutex_m, and adjust production config for static file serving
- add Kubernetes manifests for Decidim, Grafana and Matomo, including deployment, service, and persistent volume claims
- updated [PAR-PAS002] ��� Create single-question polls
- updated [PAR-PAS002] ��� Create single-question polls
- add migrations and webpacker installation for decidim_decidim_awesome
- add Keycloak OAuth2 configuration to Grafana setup
- update organization colors for improved branding consistency
- implement single-question polls creation with validation and template support

## PR Merge

- test: [PAR-MACT001] ��� Send mass email communications- test: [PAR-DE002] ��� Export debate data- test: [PAR-DE001] ��� Export survey answers- decidim variables configuration updated- [PAR-EA001] ��� Add meetings component to a specific process- test: [PAR-CP004] ��� Citizen invitation to participate in a private process- Tool3 infraestructure deploy- test [PAR-PAS005] ��� Review result of specific surveys- test: [PAR-PAS004] ��� Reply to a survey- db files added- Deploy Integration Env- [ISSUE-SEP01] Add keycloack auth to grafana and matomo- [PAR-PAS003] ��� Create detailed surveys with configurable options- Deleting Files whith name OLD or COPY- [PAR-PAS002] ��� Create single-question polls- Solved Problems and Vuls QA

## refactor

- reorganize Decidim deployment configuration for clarity and maintainability
- streamline organization creation and user setup in test preparation script
- restructure Jitsi integration by organizing constants and decorators into modules

## fix

- update secret values in Grafana, Matomo, Decidim, and Jitsi configurations for consistency
- update Matomo secret file path in Kubernetes deployment configuration
- correct indentation for environment variable loading in Grafana StatefulSet
- ensure max-height is explicitly set for ldt-admin-header
- update SQL queries in participation demographics dashboard for accuracy
- update privacy policy agreement messages for clarity and specificity
- update logo class and styles for consistency in admin header
- add privacy policy agreements and related messages in multiple languages
- correct indentation in redis deployment configuration
- correct indentation in redis deployment configuration
- correct indentation in redis deployment configuration
- correct indentation in postgres StatefulSet configuration
- correct indentation for terminationGracePeriodSeconds in postgres StatefulSet configuration
- correct sonar.exclusions line formatting in sonar-project.properties
- comment out decidim-decidim_awesome gem reference to prevent build issues
- update decidim-decidim_awesome gem reference to latest revision and remove branch specification
- update sonar.exclusions to include tests/acceptance directory
- streamline organization creation with minimal attributes and dynamic color settings
- add missing copy for decidim-meetings-jitsi in Dockerfile

## file_changes

- Deleted file-storage.yml.old- Deleted COPY3 file-storage.yaml- Deleted COPY file-storage copy.yml- Deleted COPY3 ingress.yml- Deleted COPY3 service.yml- Deleted configMap\_\_OLD.yml- Deleted db-secrets copy.yaml- Deleted COPY3 service.yml- Deleted COPY3 secrets.yml- Deleted COPY3 configMap.yml- Deleted COPY_configMapDB.yml- Deleted COPY tool3-fe-config-configmap.yaml- Deleted COPY service.yml- Deleted COPY secretsMap.yml- Deleted COPY configMap.yml- Deleted COPY3 statefulSet.yml- Deleted COPY statefulSet.yml- Deleted COPY statefulSet.yml

# Changelog from D03.04.Aug to D03.04.Sep

## feat

- update sonar exclusions to enhance code analysis coverage
- update sonar exclusions to enhance code analysis coverage
- update sonar exclusions to improve code analysis accuracy
- enhance Keycloak integration to include user roles and admin synchronization
- fix decidim and shakapacker awesome dependencies
- add Matomo analytics integration with middleware for HTML response injection
- add grafana dashboards
- update README to enhance feature descriptions and usage instructions
- centralize Jitsi default constants and update references in controllers and decorators
- add dependecy of new gem
- add gem decidim-decidim_awesome
- implement Jitsi URL generation with new controller and global route
- add Jitsi integration for Decidim Meetings with URL generation and settings
- update @fullcalendar packages to version 6.1.19
- fixed keycloak authentication, fixed generated keycloak authentication URL
- added process helper with utils, overall improvements
- reduced timeout from 500ms to 100ms
- removed redundand test, other improvements
- forked and added keycloak module,fixed CSP errors, fixed webpack warnings
- add SMTP configuration to .env.example and docker-compose.yml
- removed unused declarations, improved test logic
- optimized test logic
- added missing test
- improve Windows setup instructions for clarity and organization
- restructure README for clarity and enhance setup instructions
- enhance Makefile and docker-compose.yml for improved setup commands and database management
- add Jitsi configuration and services to Docker Compose setup
- improved meetings status check, removed unused variables
- remove package-lock.json and update docker-compose configuration
- fixed duplicate
- improved share button click logic, removed unused code
- change EOL from CRLF to LF
- replaced timeouts with a better solution
- removed unused props
- cleaned up test code
- update Ruby version specification to 3.2
- update Ruby version to 3.2
- update .decidim_upgrade_completed file
- update dependencies and licenses in package-lock.json
- update yarn.lock file
- enhance meeting publish verification and success notification
- add USER_WITHOUT_MESSAGES to test users and update auth-helper for login
- update gitignore
- update gitignore
- added missing tests for managing meeting component agenda, improved auth helper
- add test suite for publish a meeting
- add test suite for edit event details
- add test suite for unfollow items
- add test suite for follow items
- fixed wrong test
- add send private message test suite
- add view all conversation test suite
- update content security policies and WebSocket configuration for improved compatibility
- reformat YAML file for improved readability
- added missing tests for unpublishing a meeting
- added missing test for sharing to social media
- added revoke consent for data processing test
- added survey template creation tests and fixed shakapacker assets not being served correctly
- updated decidim to version 0.30.1 latest

## PR Merge

- [ISSUE-AUG09] - First login keycloack admin- [PAR-RG001] ��� View reports and analytics | Configuration- ISSUE-AUG02: Fields up to 1 GB of data- [PAR-EA001] - Configure Jitsi- pipeline order execution changes- New update aggents for Ruby- Apply Install Java and delete warn Deprecated- images buildAndPush cancelled- more changes reverted- reverting last changes- secretid fixed- manage acr-secret- variable group added- container changes- image container changed- added acr-secret- new image apply to FE- change tool3-back image- port change attemp 6- port change attemp 3- port change attemp 2- format applied- Port changed for FE- services fixed in BuildandDeploy- Service ports fixed- Undo changes- dockerfile added- service endpoint name changed- New format applied- Applying new format- Applying new format- general troubleshouting Tool3- troubleshouting CrashLoopBackOff- app changes- ServiceName Issue- nested issue- storage changes- host name fixed- storage changes- fixec comment issue- storage modified- storage modified- storage shared added- containers order creation modified- change port tool3-front in ingress- Troubleshouthing - configuring less containers- postgresq volume excluded from statefulset- troubleshouting postgres- Env variables modified- ConfigMap Renamed- ConfigMap change- postgres key added- host key added in configMap- ConfigMap changes- VolumeMounts change- Ports numbers changed in Ingress- port changes in services configuration- service fe modified- port tool3-fe modified in Statefulset- Defautl Microsoft image applied- Folders tool3-ts created- replace token section commented- fixed missing directory- Push images- shared-files mount options changed- tool3-shared-volume mount options changed- tool3-shared-files changes- tool3-shared-files volume changes- namespace issue fixed- configuration from Tool0 copied- secrets added- change postgres user- change tcp port in fe- Backend service port changed- secret added to tool3-config- tool3-fe-config copied- configmap changes- configmap changes- configmap modified- volume fe data added in configmap- configmap FE fixed- variables updated- namespace fixed in ConfigMap Frontend- BuildandDeploy yaml renamed- BuildandDeploy configs- Deploy default image- Service Endpoint name changed- pipeline name changed- BuildandDeploy renamed- Update FE and Postgresql configurations- FE container and postgresql added- changed service port- renamed service name in ingress- renamed image name in statefullset- service changed in ingress.yml- [ISSUE] - Keycloak authentication- [PAR-MACT001] ��� Send mass email communications - CONFIGURATION- type StringData changed- Azure Endpoint modified- Added Apply SecretsMap in Deploy- host changed in ingress.yml- [PAR-EA008] - Cancel an event- [PAR-EA006] ��� Manage meeting agenda- [PAR-EA005] ��� Unpublish a meeting- ConfigMap backend modified- Service Connection renamed- Creation structure yaml files for infraestructure- [ISSUE-AUG08] Create a new make command- [PAR-INI04] - Configure Jitsi local instance- Delete comments in spanish- Update Version Ruby- [PAR-CS001] - Share content on social media platforms- [PAR-DPACM002] - Revoke consent for data processing- [PAR-PAS001] - Create survey template- [PAR-EA004] ��� Publish a meeting- [PAR-EA003] ��� Edit event details- [PAR-NOT003] ��� Unfollow items- [PAR-NOT002] ��� Follow items- [PAR-UPM001] ��� Send private messages- [PAR-UPM002] ��� View all conversations

## refactor

- remove duplicated admin cleanup configuration from Playwright setup
- simplify success message verification in publish meeting test
- remove redundant final verification steps in publish meeting test
- enhance meeting form validation and add utility for date handling
- add verification for updated event details in edit-event-details.spec.ts
- remove unnecessary console log from unfollow items test
- remove unused imports and variables in follow items test suite
- remove redundant comments and improve code clarity in HomePage
- remove unused imports and notification settings from view all conversations test
- restored the module after decidim update

## fix

- update postgresVersion to 1600 in Grafana datasource configuration
- remove allowed_push_host metadata from gemspec
- clean up Gemfile and ApplicationController formatting
- restored jitsi configuration
- changed keycloak logo, changed keycloak auth URL
- add check-env target to ensure .env file exists
- update healthcheck command for decidim service
- fixed project not starting after merge
- update decidim 0.30 not working
- remove unnecessary skip condition for no conversations test
- simplify empty state message verification in view all conversations test
- remove timeout from empty state message visibility check in conversation tests
- remove extraneous comment from database migration commands
- ensure database migrations are installed and run in both development and production environments
- fullcalendar js and css not working

## file_changes

- added acr-secret- added postgres migrate key- renamed service name in ingress- renamed image name in statefullset- Added Apply SecretsMap in Deploy

# Changelog from D03.04.Jul to D03.04.Aug

## feat

- general improvements
- added status check change
- added missing throw error
- update README.md with Git configuration instructions for Windows users to ensure proper line ending handling
- update .gitignore to include vendor directory in decidim_application
- removed references to localhost
- added test to verify that hidden resouce is no longer accessible
- add .dockerignore to exclude unnecessary files from Docker context
- enhance Docker setup with improved dependency management and CSP configuration
- add .dockerignore to exclude unnecessary files from Docker context
- configure Shakapacker for development environment and add manifest support
- added missing checks to global moderation tests, other fixes
- add environment configuration and docker-compose files for Decidim application
- update README and Makefile to include Grafana and Matomo service URLs
- configure Shakapacker for development environment and allow all hosts
- reformat YAML file for improved readability and consistency
- add .editorconfig and .gitattributes for consistent coding styles and line endings
- format Dockerfile for improved readability
- remove unused docker-compose.yml file
- add check to verify if other fields are changed
- add test suite for managing notification settings
- add instructions for accessing the application after setup in README
- enhance Makefile for cross-platform compatibility and update README with setup instructions
- add test suite for mark notifications as reads
- add Makefile for automated setup and enhance README with development instructions
- add test suite for view notifications
- change test description
- add test suite for share calendar
- add test suite for calendar
- add decidim calendar gem
- add test suite for share events
- add test suite for view meeting detail
- add test suit for view process meetings
- split test suite for account deletion request with alternative flow
- skip user extra fields configuration and validation tests for refactoring
- enhance setup process for category edit and delete tests
- enhance private participants and admins creation with multiple entries
- fix tests
- added missing tests for process moderation
- added missing test for global moderation
- add Grafana and Matomo configuration and dashboards for Decidim analytics
- add test suite for delete categories
- add edit category functionality and validation tests
- add test suite for manage categories
- add test to configure available components
- add test to manage process phases
- update tests directories
- automated data preparation for testing, fixed tests using redundant locale
- added missing tests for terms of use

## PR Merge

- [PAR-NOT005] ��� Manage notification settings- [PAR-NOT004] ��� Mark notifications as reads- [PAR-NOT001] ��� View notifications- [PAR-EP007] ��� Add in personal calendar- [PAR-EP006] ��� View calendar- [PAR-EP003] ��� Share events- [PAR-EP002] ��� View meeting details- [PAR-EP001] ��� View all meetings related to specific process- refactor: new fake data implementation- [PAR-MOD002] - Process Moderation- [PAR-MOD001] - Global Moderation- Correccion Fichero Participate- Repo Mirror to Lot5.yml- Update Lot5- feat: add Makefile for automated setup and enhance README with development instructions- [PAR-INI03] Initializate project (Grafana/Matomo)- Resolucion de problema- Ajustamos variable correctamente del LOT5- [PAR-PPM006] ��� Delete category in process- [PAR-PPM005] ��� Edit category in process- [PAR-PPM004] ��� Manage categories in process- [PAR-PPM003] ��� Configure available components- [PAR-PPM002] ��� Manage process phases- [PAR-DAAP001] - View privacy policy page- Updated EU LDT Participate- Repo Mirror to Lot5.yml- Added EU LDT Participate- Repo Mirror to Lot5.yml

## refactor

- fixed shakapacker not working correctly
- remove unused navigation methods from PrivacyPolicyPage and streamline test steps
- clean up comments and improve readability in process creation tests
- fixed shakapacker not working correctly
- remove unused menuBarContainer getter from HomePage
- remove unused pageWrapper and form locators from NewPageComponentPage
- remove unused adminSidebarSettings locator from SidebarProcessDetailComponent
- remove unnecessary --workers=1 flag from Playwright test scripts
- remove unused TEST_TIMEOUTS constants from constants.ts
- centralize test asset paths in constants and update usages in UploadFileModalComponent and ProcessAdminPage
- clean up database preparation script by removing unused variables and comments
- remove debug methods from various component pages
- update activity card selectors to use English terms
- update comments and remove unused cookie bar selectors in CookieBarComponent
- remove unused waitForProcessGroupsPageLoad method from ProcessAdminPage
- remove unused filter and help elements from ProcessesOverviewPage
- removed unused localization test data
- update import paths for user-related pages and fixtures
- removed italian comments and removed redundant italian locale tests
- clean up HeaderComponent for improved readability and maintainability
- edit test to work with fake generated data
- remove unused test data for convocation page update tests
- remove other languages comments
- add private participant and admin creation methods in ProcessAdminPage
- enhance process update test suite with improved navigation and step descriptions
- update default email values in test configurations and improve database setup in entrypoint script
- set test with global setup
- add db init setup and update delete user tests

## fix

- update URL expectation in HomePage to support full URL validation
- update default admin and user credentials in Makefile
- add missing newline at end of development.rb
- update .gitignore to exclude admin-state.json files and remove obsolete admin-state.json
- remove drop comment
- update development server configuration for shakapacker
- add check on missing fields
- update file permissions for executable scripts and improve Dockerfile comments
- update file path handling in UploadFileModalComponent and constants for consistency
- update convocation page title verification to match new title
- clarify user deletion authentication log messages
- refactor cookie compliance tests to use HomePage navigation and remove redundant calls
- skip admin extra user fields configuration tests and enhance setup process
- update testMatch pattern for account deletion tests to include all spec files
- remove unnecessary line in manage attachments test for clarity
- ensure title comparison is case-insensitive and trimmed in debates page

## file_changes

- Added EU LDT Participate- Repo Mirror to Lot5.yml

# Changelog from D03.04.Jun to D03.04.Jul

## feat

- add delete admins tests
- add edit functionality for process administrators and related tests
- add test to manage process admins
- implement delete functionality for private participants in private processes
- implement management of private participants for private processes
- added missing tests
- fix tests
- add confirm delete modal component and delete attachment test suite
- add edit attachment functionality for process management
- add manage attachments test suite for process management
- add view and participate in a specific process test suite
- add view all processes test suite with filtering options
- add mention user in message test suite
- update endorse debate test suite and user story descriptions
- add endorse debate tests
- add close debates tests
- fix tests for cookies
- updated test structure
- add initial close debate tests
- add debate pages and participation tests
- fix create-debate test
- add create-debates page tests
- add add-debates page tests
- add public convocation page tests
- add convocation page tests
- add account deletion tests
- update POM architecture
- added trigger only on main for testing pipe
- added testing pipeline (playwright/pact/locust)
- added testing pipeline (playwright/pact/locust)
- refactor e2e architecture
- added missing tests

## PR Merge

- [PAR-PPR003] ��� Delete an existing process administrator- [PAR-PPP001] ��� Manage private participants (Only If the process is private)- [PAR-PPM008] - Added QA Tests- [PAR-PPA003] | Delete an existing attachment- PAR-PPA001 | PAR-PPA002- PAR-CP002 | View and participate in a specific process- PAR-CP001 | Visualize all processes in the system- PAR-DAD006 | Mention user in a message- PAR-DAD/PAR-DAD005 | test: add endorsement tests- PAR-DAD004 | test: add close debate tests- test: user patecipate to a debates- [PAR-DPACM001] - Added QA Tests- test: add create-debates page tests- test: add add-debates page tests- test: add public convocation page tests- test: add convocation page tests- PAR-DAAP003- ci: added testing pipeline and refactor test base structure

# Changelog from Initial commit to D03.05.Jun

## fix

- small fix for test execution
- small fix for test execution

## feat

- added skip on tests folder for snyk
- added skip on tests folder for snyk
- added skip on tests folder for snyk
- added missing tests
- added missing tests
- added missing tests
- added decidim module
- fix path sbom-ruby.xml
- automated decidim deployment using docker, added shakapacker for hot reload support
- fixed copy command of sbom decidim
- removed format on cyclonedx-ruby command
- updated gem for cyclonedx
- updated gem for cyclonedx
- update ruby version
- check with different ruby version
- updated gem for cyclonedx
- updated correct task for ruby
- updated sbom for decidim app
- improved FE test case
- improved BE test case
- added decidim exclusion
- update SQ project key
- added qualitychecks pipe
- refactor project structure for decidim
- startup frontend chatbot project
- update readme backend
- startup backend chatbot project
- added base structure for playwright, locust test
- added changelog, code of conduct, codebase structure, license and readme
- added base repo structure and conventional commits
- decidim application configuration
- startup base project

## PR Merge

- [PAR-PPM001] ��� Create new process- [PAR-PIM003] ��� Update personal information- [PAR-PIM001] ��� Configure form for additional personal data on first login- Startup Participate project

# Changelog from D03.04.Jul to HEAD
 
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






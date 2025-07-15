# End-to-End Tests with Playwright

This directory contains end-to-end (E2E) tests for the EU LDT Use Cases and Scenarios project. These tests are written using [Playwright](https://playwright.dev/).

## Prerequisites

* [Node.js](https://nodejs.org/) (LTS version specified in project root `.nvmrc`)
* [NVM](https://github.com/nvm-sh/nvm) - Node Version Manager (recommended)
* [npm](https://www.npmjs.com/)

## Setup

1. **Navigate to the project root and setup Node.js version:**

   ```bash
   cd ../../../  # Navigate to project root
   nvm install   # Install the Node.js version specified in .nvmrc
   nvm use       # Use the correct Node.js version
   ```

2. **Navigate to E2E directory and install dependencies:**

   ```bash
   cd tests/acceptance/e2e
   npm install
   npx playwright install --with-deps
   ```

## Running Tests

### Available Commands

```bash
# Run tests in different environments
npm run test:dev        # Development environment (default: http://localhost:3000)
npm run test:ci         # CI environment
npm run test:prod       # Production environment

# Run tests with interactive UI
npm run test-ui         # Standard UI mode
npm run test-ui-port0:dev   # UI mode on random port (dev environment)
npm run test-ui-port0:ci    # UI mode on random port (CI environment)
npm run test-ui-port0:prod  # UI mode on random port (prod environment)

# View test reports
npm run report          # Show HTML report
```

### Environment Configuration

Tests use environment-specific configuration files:

* `.env.development` - Local development settings
* `.env.ci` - CI/CD pipeline settings  
* `.env.production` - Production environment settings

The target application URL is configured via `FE_BASE_URL` environment variable (defaults to `http://localhost:3000`).

## Writing Tests

Tests are organized by user role and follow the Page Object Model (POM) pattern:

```text
tests/acceptance/e2e/
├── tests/
│   ├── admin/          # Administrator user tests
│   ├── user/           # Regular user tests
│   └── public/         # Public/anonymous user tests
├── pages/              # Page Object Models
├── fixtures/           # Test fixtures and utilities
└── utils/              # Helper functions
```

### Test Structure Guidelines

```text
* Use `*.spec.ts` for test files
* Organize tests by user type and process/scenario
* Place shared code in `fixtures/` and `utils/`
* Use `playwright.config.ts` for global settings
* Store test reports in `playwright-report/`
```

Refer to the [Playwright documentation](https://playwright.dev/docs/intro) and project-specific guidelines in `.github/copilot-instructions.md` for more details.

## Resources

* [Playwright Documentation](https://playwright.dev/docs/intro)
* [Node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/)

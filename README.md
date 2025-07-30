# EU LDT Participate

## Overview

**EU LDT Participate** is a modular, open-source-based platform designed to facilitate collaborative decision-making, analytics, and real-time communication. The project integrates the following components:

* **Decidim:** A civic participation framework for managing proposals, deliberation, and participatory processes.
* **Matomo & Grafana:** Analytics and monitoring solutions to track usage metrics and system health.
* **Jitsi Meet:** A self-hosted video conferencing solution for live discussions.
* **Chatbot:** A custom conversational agent with a React frontend (wrapped as a WebComponents) and a Fastify (Node.js).
* **CI/CD:** Automated pipelines for testing, building, and deploying each component.
* **Infrastructure as Code:** Terraform, Helm, and Ansible configurations to manage environments and deployments.
* **Testing:** Comprehensive test suites covering unit, integration, acceptance, contract, and performance testing.

## Main Features

* **Modular Architecture:** Components are isolated into dedicated directories, enabling independent development, testing, and scaling.
* **Automation:** Centralized CI/CD pipelines and reusable scripts streamline build, test, and deployment workflows.
* **Scalability:** Easily extendable to include new modules such as message brokers (Kafka), API gateways, or additional microservices.
* **Code Quality:** Shared linting, formatting, and testing configurations enforce coding standards and prevent regressions.
* **Observability:** Preconfigured Grafana dashboards and Matomo reports provide actionable insights into platform usage and performance.

## Monorepo Structure

```bash
├── cicd/                          # CI/CD pipelines and workflows
├── infrastructure/                # Infrastructure as Code (Terraform, Helm, Ansible)
├── decidim/                       # Decidim core and custom extensions
├── analytics/                     # Matomo & Grafana configurations
├── jitsi/                         # Jitsi Meet deployment and customizations
├── frontend/                      # React application for the chatbot UI
├── backend/                       # Fastify (Node.js) chatbot service
├── tests/                         # Integration, acceptance, contract, and performance tests
│   └── acceptance/
│       └── e2e/                   # Playwright E2E tests organized by user role and process
├── utils/                         # Helper scripts and developer tools
└── docs/                          # High-level documentation (architecture, setup, troubleshooting)
```

## Getting Started

## Cross-Platform Compatibility

This project is designed to work seamlessly across Linux, macOS, WSL, and native Windows environments.

### Line Ending Handling

The project uses **`.gitattributes`** and **`.editorconfig`** files to ensure consistent line endings across all platforms:

* **`.gitattributes`**: Automatically normalizes line endings to LF for script files, preventing execution issues in Docker containers
* **`.editorconfig`**: Ensures your editor respects the correct line ending settings

**This means:**

* ✅ **Windows users**: No manual line ending conversion needed
* ✅ **Linux/macOS users**: Everything works as expected
* ✅ **Docker containers**: Always receive files with correct line endings
* ✅ **Git operations**: Automatic line ending normalization

### Prerequisites

* **Operating System**: Linux, macOS, or Windows (WSL recommended, but native Windows is now supported)
* [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
* [Node.js](https://nodejs.org/) (LTS) and npm or yarn
* **Make**: Required for running the Makefile. On Windows, install via [Chocolatey](https://chocolatey.org/) with `choco install make`.
* [NVM](https://github.com/nvm-sh/nvm) - Node Version Manager for managing Node.js versions (Linux/macOS/WSL)
* [nvm-windows](https://github.com/coreybutler/nvm-windows) - Node Version Manager for Windows (native Windows only)
* [Helm](https://helm.sh/) and [kubectl](https://kubernetes.io/) for Kubernetes deployments

### Local Development Setup

> **🚀 Recommended: Use Makefile for automated setup**
>
> The project includes a comprehensive Makefile that automates the entire development environment setup. This is the recommended approach for both new and experienced developers.

#### Option A: Automated Setup with Makefile (Recommended)

First, start Docker if you don't have it started yet, then clone the repository and navigate to the project root:

```bash
git clone https://EULDT-Toolbox@dev.azure.com/EULDT-Toolbox/EU%20LDT%20Participate/_git/EU%20LDT%20Participate
cd eu-ldt-participate
```

**Windows users:**

* Install [Chocolatey](https://chocolatey.org/) if not present.
* Install Make: `choco install make`
* Install [nvm-windows](https://github.com/coreybutler/nvm-windows) and ensure it is in your PATH.

> **⚠️ Important for Windows users:** Before cloning or if you already have the repository, run these Git configuration commands to ensure proper line ending handling:
>
> ```bash
> git config core.autocrlf false
> git config core.eol lf
> git add --renormalize .
> git reset --hard HEAD
> ```
>
> **📝 Note:** This project uses `.gitattributes` to automatically handle line ending conversion. The commands above ensure your local Git configuration is properly aligned with the project's line ending requirements.

**Linux/macOS/WSL users:**

* Ensure you have GNU Make and [nvm](https://github.com/nvm-sh/nvm) installed.

Then use the Makefile for complete automated setup (works on Linux, macOS, WSL, and Windows):

```bash
# Show all available commands
make help

# Complete environment setup (includes NVM/nvm-windows, dependencies, Playwright, Decidim)
make setup

# Alternative: Quick setup without Playwright (faster)
make quick-setup

# Start all services
make start

# Run all tests
make test-all
```

**Key Makefile Commands (cross-platform):**

```bash
# Setup & Environment
make setup                # Complete automated environment setup
make quick-setup          # Fast setup without Playwright
make validate-env         # Check if all tools are properly installed
make info                 # Show project information and structure

# Service Management
make start                # Start Decidim services
make stop                 # Stop all services
make restart              # Restart services
make status               # Check service status
make logs                 # View Decidim logs

# Development
make dev-decidim          # Start Decidim
make dev-frontend         # Start frontend development server
make dev-backend          # Start backend development server
make dev-all              # Instructions for all development servers

# Testing
make test                 # Run Playwright E2E tests
make test-all             # Run all tests (backend, frontend, E2E)
make test-playwright      # Run Playwright E2E tests
make test-playwright-ui   # Run Playwright with UI
make test-frontend        # Run frontend unit tests
make test-backend         # Run backend unit tests
make report-playwright    # Show Playwright test report

# Utilities
make clean                # Clean up containers and data
make reset                # Complete reset and setup
make urls                 # Show all service URLs
```

Now that you have everything running, go to the section **Use the application**

#### Option B: Manual Setup (Advanced Users)

If you prefer manual control over the setup process, follow these steps:

##### 1. Initial Setup

**Windows users - Git Configuration (Important First Step):**

If you're on Windows, **before cloning** or if you already have the repository, configure Git to handle line endings correctly:

```bash
git config core.autocrlf false
git config core.eol lf
# If you already have the repository cloned:
git add --renormalize .
git reset --hard HEAD
```

This ensures compatibility with the project's `.gitattributes` configuration and prevents Docker execution issues.

First, clone the repository and navigate to the project root:

```bash
git clone https://EULDT-Toolbox@dev.azure.com/EULDT-Toolbox/EU%20LDT%20Participate/_git/EU%20LDT%20Participate
cd eu-ldt-participate
```

##### 2. Node.js Version Management

This project uses NVM to ensure consistent Node.js versions across different environments. The required Node.js version is specified in the `.nvmrc` file.

```bash
# Install and use the required Node.js version
nvm install
nvm use
```

##### 3. Install Root Dependencies

Install the monorepo dependencies:

```bash
npm install
```

##### 4. Playwright E2E Tests Setup

Navigate to the Playwright tests directory and install dependencies:

```bash
cd tests/acceptance/e2e
npm install
npx playwright install --with-deps
```

**E2E Tests Structure:**

* Tests are organized by user role and process:
  * `tests/acceptance/e2e/tests/admin/` - Admin user workflows
  * `tests/acceptance/e2e/tests/public/` - Public user workflows
  * `tests/acceptance/e2e/tests/user/` - Authenticated user workflows
* Each process/scenario has its own subfolder
* Test files use the `.spec.ts` extension
* Page Object Models are in the `pages/` directory
* Shared utilities are in the `utils/` directory

Available Playwright commands:

```bash
# Run tests in different environments
npm run test:dev        # Development environment
npm run test:ci         # CI environment  
npm run test:prod       # Production environment

# Run tests with UI
npm run test-ui         # Standard UI mode
npm run test-ui-port0   # UI mode on random port

# View test reports
npm run report
```

##### 5. Decidim Setup with Docker Compose

Decidim is the core civic participation framework. To run it locally:

```bash
# Navigate to the Decidim application directory
cd decidim/decidim_application

# Start all services (Decidim, PostgreSQL, Redis, Shakapacker)
docker-compose up -d

# View logs (optional)
docker-compose logs -f decidim

# Stop services
docker-compose down
```

##### 6. How to use application

The Decidim application will be available at `http://localhost:3000`.

**Default Admin Credentials** (development only):

* Email: `admin@example.org`
* Password: `decidim123456789`

**Default Simple User Credentials** (development only):

* Email: `user@example.org`
* Password: `decidim123456789`

**Default User to delete Credentials** (development only):

* Email: `user2@example.org`
* Password: `decidim123456789`

**Services included:**

* **Decidim App**: Main application (`http://localhost:3000`)
* **PostgreSQL**: Database service
* **Redis**: Cache and session storage
* **Shakapacker**: Asset compilation service (`http://localhost:3035`)

##### 6.1. Analytics Services Configuration

The project includes analytics infrastructure with Grafana and Matomo services:

**Grafana Dashboard:**

* **URL**: `http://localhost:3000/grafana/`
* **Default Credentials**:
  * Username: `admin`
  * Password: `admin`
* **Purpose**: System monitoring and metrics visualization
* **Configuration**: Pre-configured dashboards for Decidim monitoring

**Matomo Analytics:**

* **URL**: `http://localhost:8080`
* **Database**: MariaDB backend included
* **Initial Setup Required**: After starting the services, you must access the Matomo web interface to complete the initial configuration:
  1. Navigate to `http://localhost:8080`
  2. Follow the setup wizard
  3. Configure database connection (MariaDB container is automatically available)
  4. Create admin user and configure site tracking
* **Purpose**: Web analytics and user behavior tracking

**Additional Analytics Services:**

* **MariaDB**: Database backend for Matomo (`localhost:3306`)

To start analytics services along with Decidim:

```bash
cd decidim/decidim_application
docker-compose up -d
```

All analytics services are included in the main docker-compose configuration and will start automatically.

##### 7. Frontend Chatbot Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
npm run dev
```

##### 8. Backend Chatbot Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
npm run dev
```

### Development Workflow

#### Using Makefile (Recommended)

```bash
# First-time setup
make setup

# Daily development workflow
make start                    # Start Decidim
make test-all                # Run all tests
make dev-frontend            # Start frontend (in separate terminal)
make dev-backend             # Start backend (in separate terminal)
make dev-backend             # Start backend (in separate terminal)
```

#### Manual Commands

1. **Start Decidim**: `cd decidim/decidim_application && docker-compose up -d`
2. **Run Playwright Tests**: `cd tests/acceptance/e2e && npm run test:dev`
3. **Frontend Development**: `cd frontend && npm run dev`
4. **Backend Development**: `cd backend && npm run dev`

## Contributing

Contributions are welcome! Please review the following before submitting a pull request:

* [CONTRIBUTING.md](./CONTRIBUTING.md)
* [CODE\_OF\_CONDUCT.md](./CODE_OF_CONDUCT.md)

## License

This project is licensed under the **EUROPEAN UNION PUBLIC LICENCE v. 1.2**. See the [LICENSE](./LICENSE) file for details.

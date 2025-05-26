# EU LDT Participate — Codebase Structure

Below is a suggested monorepo structure for **EU LDT Participate**, organized to clearly separate each component and facilitate modular development, testing, and deployment.

```
/README.md
/CHANGELOG.md
/LICENSE
/CODING_GUIDELINES.md
/CONTRIBUTING.md
/CODE_OF_CONDUCT.md

├── cicd/                          # CI/CD pipelines and workflows
│   ├── github/                    # GitHub Actions configurations
│   │   ├── build.yml
│   │   ├── test.yml
│   │   └── deploy.yml
│   ├── jenkins/                   # (Optional) Jenkinsfiles
│   │   └── Jenkinsfile
│   └── scripts/                   # Helper scripts for CI tasks
│       ├── docker-login.sh
│       └── version-bump.sh

├── infrastructure/                # Infrastructure-as-Code definitions and environment configurations
│   ├── terraform/                 # Terraform modules and state configuration
│   │   ├── modules/
│   │   ├── environments/
│   │   │   ├── prod.tfvars
│   │   │   └── staging.tfvars
│   │   └── main.tf
│   ├── ansible/                   # Ansible playbooks and roles
│   │   ├── roles/
│   │   └── site.yml
│   └── k8s/                       # Kubernetes manifests and Helm charts
│       ├── charts/
│       └── base/

├── decidim/                       # Decidim instance and custom extensions
│   ├── core/                      # Decidim core code (submodule or package)
│   ├── engines/                   # Custom engines/plugins
│   │   └── my_custom_engine/
│   │       ├── app/
│   │       ├── config/
│   │       └── spec/              # RSpec tests for the engine
│   ├── themes/                    # Custom themes
│   │   └── my_theme/
│   ├── config/                    # Decidim configuration (initializers, locales)
│   └── Dockerfile                 # Container configuration for Decidim

├── analytics/                     # Matomo & Grafana integration
│   ├── matomo/                    # Matomo deployment and configuration
│   │   ├── config.ini.php
│   │   └── docker-compose.yml
│   └── grafana/                   # Grafana dashboards and provisioning
│       ├── dashboards/
│       │   └── platform-overview.json
│       ├── datasources/
│       └── provisioning/

├── jitsi/                         # Jitsi Meet deployment and customization
│   ├── config/                    # Custom configuration overrides
│   ├── docker-compose.yml         # Deployment manifest
│   └── scripts/                   # Setup and maintenance scripts

├── frontend/                      # Custom chatbot frontend (React)
│   ├── public/                    # Static assets
│   ├── src/                       # Application code
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/              # HTTP clients, WebSocket, etc.
│   │   ├── styles/
│   │   └── App.{js,ts}
│   ├── tests/                     # Jest / Cypress tests
│   ├── package.json
│   └── Dockerfile

├── backend/                       # Custom chatbot backend (Fastify/Node.js or Python)
│   ├── src/                       # Application code
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── routes/
│   ├── config/                    # Environment templates, database migrations
│   ├── tests/                     # Unit and integration tests
│   ├── package.json or           # or requirements.txt for Python
│   └── Dockerfile

├── tests/                         # Monorepo-level tests: integration, acceptance, contract, performance
│   ├── integration/
│   ├── acceptance/
│   ├── contract/
│   └── performance/

└── utils/                         # Support scripts and developer tools
    ├── commit-msg-hook/           # Git commit hooks
    ├── codegen/                   # Code generation utilities
    └── cli/                       # CLI tools for maintenance

```

**Notes:**

* **Project Name:** All documentation files clearly reference **EU LDT Participate**.
* **Modularity:** Each major component (Decidim, analytics, Jitsi, chatbot FE/BE) is isolated under its own top-level directory.
* **CI/CD:** Centralized in `cicd/` with reusable scripts and pipeline definitions.
* **Infrastructure:** Use Terraform, Ansible, and/or Helm to version and automate deployments.
* **Testing:** Separate test suites at component and monorepo levels to ensure quality and prevent regressions.

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
├── utils/                         # Helper scripts and developer tools
└── docs/                          # High-level documentation (architecture, setup, troubleshooting)
```

## Getting Started

### Prerequisites

* [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
* [Node.js](https://nodejs.org/) (LTS) and npm or yarn
* [Helm](https://helm.sh/) and [kubectl](https://kubernetes.io/) for Kubernetes deployments

## Contributing

Contributions are welcome! Please review the following before submitting a pull request:

* [CONTRIBUTING.md](./CONTRIBUTING.md)
* [CODE\_OF\_CONDUCT.md](./CODE_OF_CONDUCT.md)

## License

This project is licensed under the **EUROPEAN UNION PUBLIC LICENCE v. 1.2**. See the [LICENSE](./LICENSE) file for details.

# Codebase Structure

This monorepo is organized to host all the components of our integrated platform in a modular and scalable way. Below is an overview of the main structure:

- **cicd/**  
  Contains the build and deployment pipelines (CI/CD).

- **infrastructure/**  
  Holds the infrastructure-as-code definitions, including Terraform files and environment configurations.

- **tests/**  
  Includes tests at various levels—unit, integration, acceptance, contract, and performance—to ensure the overall system works as expected.

- **utils/**  
  Contains support tools and scripts for tasks like commit management and CI support.

In addition to these folders, the monorepo includes key files such as LICENSE, CHANGELOG.md, CODING_GUIDELINES.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, and other documentation to support project management.

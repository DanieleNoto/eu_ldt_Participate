# EU LDT Participate - Development Makefile
# This Makefile automates the setup and testing of the EU LDT Participate platform

.PHONY: help setup install-deps check-prerequisites setup-node setup-decidim setup-playwright setup-frontend setup-backend
.PHONY: start stop restart logs test test-playwright test-frontend test-backend test-all clean
.PHONY: dev-decidim dev-frontend dev-backend dev-all status check-services

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Configuration
COMPOSE_FILE := decidim/decidim_application/docker-compose.yml
DECIDIM_URL := http://localhost:3000
FRONTEND_URL := http://localhost:5001
BACKEND_URL := http://localhost:8080

help: ## Show this help message
	@echo "$(GREEN)EU LDT Participate - Development Makefile$(NC)"
	@echo "$(YELLOW)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

check-prerequisites: ## Check if required tools are installed
	@echo "$(YELLOW)Checking prerequisites...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Error: Docker is required but not installed.$(NC)"; exit 1; }
	@command -v docker compose >/dev/null 2>&1 || { echo "$(RED)Error: Docker Compose is required but not installed.$(NC)"; exit 1; }
	@bash -c "source ~/.nvm/nvm.sh && command -v nvm" >/dev/null 2>&1 || { echo "$(RED)Error: NVM is required but not installed.$(NC)"; exit 1; }
	@echo "$(GREEN)✓ All prerequisites are installed$(NC)"

setup-node: check-prerequisites ## Setup Node.js using NVM
	@echo "$(YELLOW)Setting up Node.js version...$(NC)"
	@bash -c "source ~/.nvm/nvm.sh && nvm install && nvm use"
	@echo "$(GREEN)✓ Node.js setup completed$(NC)"

install-deps: setup-node ## Install all dependencies
	@echo "$(YELLOW)Installing root dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)✓ Root dependencies installed$(NC)"

setup-playwright: install-deps ## Setup Playwright E2E tests
	@echo "$(YELLOW)Setting up Playwright E2E tests...$(NC)"
	@cd tests/acceptance/e2e && npm install
	@cd tests/acceptance/e2e && npx playwright install --with-deps
	@echo "$(GREEN)✓ Playwright setup completed$(NC)"

setup-frontend: install-deps ## Setup frontend dependencies
	@echo "$(YELLOW)Setting up frontend dependencies...$(NC)"
	@cd frontend && npm install
	@echo "$(GREEN)✓ Frontend setup completed$(NC)"

setup-backend: install-deps ## Setup backend dependencies
	@echo "$(YELLOW)Setting up backend dependencies...$(NC)"
	@cd backend && npm install
	@echo "$(GREEN)✓ Backend setup completed$(NC)"

setup-decidim: check-prerequisites ## Setup Decidim with Docker Compose
	@echo "$(YELLOW)Setting up Decidim...$(NC)"
	@chmod +x decidim/decidim_application/docker-entrypoint.sh
	@chmod +x decidim/decidim_application/bin/*
	@cd decidim/decidim_application && docker compose build
	@echo "$(GREEN)✓ Decidim setup completed$(NC)"

setup: setup-node install-deps setup-playwright setup-frontend setup-backend setup-decidim ## Complete environment setup
	@echo "$(GREEN)🎉 Complete environment setup finished!$(NC)"
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Run 'make start' to start all services"
	@echo "  2. Run 'make test-all' to run all tests"
	@echo "  3. Access Decidim at $(DECIDIM_URL)"

start: ## Start all services
	@echo "$(YELLOW)Starting Decidim services...$(NC)"
	@cd decidim/decidim_application && docker compose up -d
	@echo "$(GREEN)✓ Decidim services started$(NC)"
	@echo "$(YELLOW)Decidim will be available at: $(DECIDIM_URL)$(NC)"
	@echo "$(YELLOW)Default admin credentials: admin@admin.com / decidim123456789$(NC)"

stop: ## Stop all services
	@echo "$(YELLOW)Stopping Decidim services...$(NC)"
	@cd decidim/decidim_application && docker compose down
	@echo "$(GREEN)✓ Decidim services stopped$(NC)"

restart: stop start ## Restart all services

logs: ## View Decidim logs
	@cd decidim/decidim_application && docker compose logs -f decidim

status: ## Check status of all services
	@echo "$(YELLOW)Checking service status...$(NC)"
	@cd decidim/decidim_application && docker compose ps

check-services: ## Check if services are responding
	@echo "$(YELLOW)Checking service health...$(NC)"
	@curl -s -o /dev/null -w "Decidim: %{http_code}\n" $(DECIDIM_URL) || echo "Decidim: Not responding"

dev-decidim: start ## Start Decidim in development mode
	@echo "$(GREEN)Decidim is running at $(DECIDIM_URL)$(NC)"

dev-frontend: setup-frontend ## Start frontend in development mode
	@echo "$(YELLOW)Starting frontend development server...$(NC)"
	@cd frontend && npm run dev

dev-backend: setup-backend ## Start backend in development mode
	@echo "$(YELLOW)Starting backend development server...$(NC)"
	@cd backend && npm run dev

dev-all: start ## Start all development services
	@echo "$(GREEN)Starting all development services...$(NC)"
	@echo "$(YELLOW)Run the following commands in separate terminals:$(NC)"
	@echo "  make dev-frontend  # Frontend at $(FRONTEND_URL)"
	@echo "  make dev-backend   # Backend at $(BACKEND_URL)"
	@echo "$(YELLOW)Decidim is already running at $(DECIDIM_URL)$(NC)"

test-playwright: setup-playwright start ## Run Playwright E2E tests
	@echo "$(YELLOW)Running Playwright E2E tests...$(NC)"
	@cd tests/acceptance/e2e && npm run test:dev
	@echo "$(GREEN)✓ Playwright tests completed$(NC)"

test-playwright-ui: setup-playwright start ## Run Playwright tests with UI
	@echo "$(YELLOW)Running Playwright tests with UI...$(NC)"
	@cd tests/acceptance/e2e && npm run test-ui

test-frontend: setup-frontend ## Run frontend tests
	@echo "$(YELLOW)Running frontend tests...$(NC)"
	@cd frontend && npm test
	@echo "$(GREEN)✓ Frontend tests completed$(NC)"

test-backend: setup-backend ## Run backend tests
	@echo "$(YELLOW)Running backend tests...$(NC)"
	@cd backend && npm test
	@echo "$(GREEN)✓ Backend tests completed$(NC)"

test-all: test-backend test-frontend test-playwright ## Run all tests
	@echo "$(GREEN)🎉 All tests completed successfully!$(NC)"

test: test-playwright ## Run default tests (Playwright E2E)

report-playwright: ## Show Playwright test report
	@cd tests/acceptance/e2e && npm run report

clean: stop ## Clean up containers and dependencies
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@cd decidim/decidim_application && docker compose down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

clean-deps: ## Remove all node_modules directories
	@echo "$(YELLOW)Removing node_modules directories...$(NC)"
	@find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)✓ Dependencies cleaned$(NC)"

reset: clean clean-deps setup ## Complete reset and setup

# Development workflow shortcuts
quick-setup: check-prerequisites setup-node install-deps setup-decidim ## Quick setup without Playwright
	@echo "$(GREEN)Quick setup completed! Run 'make start' to begin.$(NC)"

ci-test: setup test-all ## CI/CD pipeline test target

# Information targets
info: ## Show project information
	@echo "$(GREEN)EU LDT Participate Development Environment$(NC)"
	@echo "$(YELLOW)Project Structure:$(NC)"
	@echo "  • Root: Monorepo configuration"
	@echo "  • Decidim: Civic participation framework ($(DECIDIM_URL))"
	@echo "  • Frontend: React chatbot UI ($(FRONTEND_URL))"
	@echo "  • Backend: Fastify chatbot service ($(BACKEND_URL))"
	@echo "  • Tests: E2E, unit, and integration tests"
	@echo ""
	@echo "$(YELLOW)Common Commands:$(NC)"
	@echo "  make setup     - Complete environment setup"
	@echo "  make start     - Start Decidim services"
	@echo "  make test-all  - Run all tests"
	@echo "  make dev-all   - Start development servers"

urls: ## Show all service URLs
	@echo "$(GREEN)Service URLs:$(NC)"
	@echo "  Decidim:   $(DECIDIM_URL)"
	@echo "  Frontend:  $(FRONTEND_URL)"
	@echo "  Backend:   $(BACKEND_URL)"
	@echo "  Shakapacker: http://localhost:3035"

# Validation targets
validate-env: ## Validate environment setup
	@echo "$(YELLOW)Validating environment...$(NC)"
	@node --version || { echo "$(RED)Node.js not found$(NC)"; exit 1; }
	@npm --version || { echo "$(RED)npm not found$(NC)"; exit 1; }
	@docker --version || { echo "$(RED)Docker not found$(NC)"; exit 1; }
	@docker compose --version || { echo "$(RED)Docker Compose not found$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Environment validation passed$(NC)"

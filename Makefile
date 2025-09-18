# Lokr File Vault - Development Commands
.PHONY: help dev build test clean docker-up docker-down migrate-up migrate-down generate

# Default target
help: ## Show this help message
	@echo "Lokr File Vault - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development
dev: ## Start development server
	@echo "Starting Lokr development environment..."
	docker-compose up --build

dev-backend: ## Start only backend services (postgres, redis, backend)
	docker-compose up postgres redis backend

dev-frontend: ## Start frontend development server
	cd frontend && npm run dev

dev-backend-local: ## Start backend locally (requires postgres and redis running)
	cd backend && go run ./cmd/server

# Build
build: ## Build all services
	docker-compose build

build-backend: ## Build backend only
	cd backend && go build -o ../bin/lokr ./cmd/server

build-frontend: ## Build frontend only
	cd frontend && npm run build

# Testing
test: ## Run all tests
	cd backend && go test -v ./...

test-coverage: ## Run tests with coverage
	cd backend && go test -v -coverprofile=coverage.out ./...
	cd backend && go tool cover -html=coverage.out -o coverage.html

test-integration: ## Run integration tests
	cd backend && go test -tags=integration ./...

test-frontend: ## Run frontend tests
	cd frontend && npm test

# Database
migrate-up: ## Run database migrations
	migrate -path backend/migrations -database "${DATABASE_URL}" up

migrate-down: ## Rollback database migrations
	migrate -path backend/migrations -database "${DATABASE_URL}" down

migrate-create: ## Create new migration (usage: make migrate-create NAME=migration_name)
	migrate create -ext sql -dir backend/migrations -seq $(NAME)

# Code generation
generate: ## Generate GraphQL code
	cd backend && go generate ./...

graphql-schema: ## Generate GraphQL schema
	cd backend/internal/delivery/graphql && go run github.com/99designs/gqlgen generate

generate-frontend: ## Generate frontend GraphQL types
	cd frontend && npm run codegen

# Docker management
docker-up: ## Start all Docker services
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-clean: ## Clean Docker containers and volumes
	docker-compose down -v --remove-orphans
	docker system prune -f

# Linting and formatting
lint: ## Run Go linter
	cd backend && golangci-lint run

lint-frontend: ## Run frontend linter
	cd frontend && npm run lint

fmt: ## Format Go code
	cd backend && go fmt ./...

fmt-frontend: ## Format frontend code
	cd frontend && npm run format

# Security
security-scan: ## Run security scan
	cd backend && gosec ./...

# Dependencies
deps: ## Download Go dependencies
	cd backend && go mod download
	cd backend && go mod tidy

deps-frontend: ## Install frontend dependencies
	cd frontend && npm install

deps-update: ## Update Go dependencies
	cd backend && go get -u ./...
	cd backend && go mod tidy

deps-update-frontend: ## Update frontend dependencies
	cd frontend && npm update

# Environment setup
env: ## Copy environment template
	cp .env.example .env

# Storage
storage-clean: ## Clean local storage directory
	rm -rf storage/*

# Production
prod-build: ## Build for production
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

prod-up: ## Start production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Monitoring
logs: ## View application logs
	docker-compose logs -f backend

logs-db: ## View database logs
	docker-compose logs -f postgres

logs-redis: ## View Redis logs
	docker-compose logs -f redis

# Cleanup
clean: ## Clean build artifacts
	rm -rf bin/
	rm -rf storage/*
	rm -f coverage.out coverage.html
	docker-compose down -v

# Install tools
install-tools: ## Install development tools
	go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
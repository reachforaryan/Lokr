# 🔒 Lokr - Secure File Vault

A production-grade secure file vault system with intelligent deduplication, advanced search, and controlled file sharing capabilities.

## 📋 Project Overview

**Lokr** is built for the BalkanID Full Stack Engineering Intern Capstone Task, implementing a comprehensive file management system with:

- **Intelligent File Deduplication** using SHA-256 content hashing
- **Google OAuth 2.0 Authentication** with email verification
- **Advanced Search & Filtering** with multi-criteria support
- **Granular File Sharing** (private, public, user-specific)
- **Role-based Access Control** (User/Admin)
- **Real-time Statistics** and storage optimization analytics

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │────│   Backend   │────│   Database  │
│  React+TS   │    │   Go+Gin    │    │ PostgreSQL  │
│   Port:3000 │    │  Port:8080  │    │  Port:5432  │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                   ┌───────┴───────┐
                   │     Redis     │
                   │   Port:6379   │
                   └───────────────┘
```

### Directory Structure

```
Lokr/
├── backend/                 # Go backend application
│   ├── cmd/server/         # Application entrypoint
│   ├── internal/           # Private application code
│   │   ├── domain/        # Business entities & interfaces
│   │   ├── usecase/       # Business logic layer
│   │   ├── repository/    # Data access layer
│   │   ├── delivery/      # Controllers & middleware
│   │   └── infrastructure/# External services
│   ├── pkg/               # Shared packages
│   ├── migrations/        # Database migrations
│   └── Dockerfile        # Backend container config
├── frontend/              # React frontend application
│   ├── src/              # Source code
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API & external services
│   │   ├── hooks/        # Custom React hooks
│   │   └── store/        # State management
│   └── Dockerfile        # Frontend container config
├── docker-compose.yml    # Development environment
├── Makefile             # Development commands
└── .env.example         # Environment template
```

## 🚀 Quick Start

### Prerequisites

- **Go 1.21+**
- **Node.js 18+**
- **Docker & Docker Compose**
- **PostgreSQL 15+**
- **Redis 7+**

### 1. Clone & Setup

```bash
git clone <repository-url>
cd Lokr
cp .env.example .env
# Edit .env with your configuration
```

### 2. Development with Docker (Recommended)

```bash
# Start all services
make dev

# Or start specific services
make dev-backend    # Backend + Database + Redis
make dev-frontend   # Frontend development server
```

### 3. Local Development

#### Backend
```bash
# Install dependencies
make deps

# Run database migrations
make migrate-up

# Start backend server
make dev-backend-local
```

#### Frontend
```bash
# Install dependencies
make deps-frontend

# Start development server
make dev-frontend
```

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start full development environment |
| `make build` | Build all services |
| `make test` | Run all tests |
| `make lint` | Run linters |
| `make deps` | Install dependencies |
| `make migrate-up` | Run database migrations |
| `make docker-up` | Start Docker services |
| `make help` | Show all available commands |

## 🔧 Tech Stack

### Backend
- **Framework**: Go (Gin)
- **API**: GraphQL (preferred) / REST
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis
- **Auth**: JWT + Google OAuth 2.0
- **Storage**: AWS S3 / Local filesystem
- **Testing**: Go testing framework

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand + Apollo Client
- **Forms**: React Hook Form + Zod
- **UI**: Headless UI + Radix UI
- **Testing**: Vitest + Testing Library

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15 with optimized configuration
- **Caching**: Redis 7
- **Reverse Proxy**: Nginx (production)
- **Monitoring**: Health checks & logging

## 🏃‍♂️ Running the Application

1. **Start Services**: `make dev`
2. **Access Application**: http://localhost:3000
3. **Backend API**: http://localhost:8080
4. **GraphQL Playground**: http://localhost:8080/graphql

## 🔐 Environment Variables

Key environment variables (see `.env.example` for full list):

```env
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/lokr

# Authentication
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Storage
USE_S3=false
STORAGE_PATH=./storage

# Rate Limiting
DEFAULT_RATE_LIMIT=2  # requests per second
DEFAULT_STORAGE_QUOTA=10485760  # 10MB
```

## 📊 Key Features

### File Deduplication
- **SHA-256 content hashing** for duplicate detection
- **Reference counting** system for safe deletion
- **Storage savings** analytics and reporting

### Authentication & Security
- **Google OAuth 2.0** integration
- **Email verification** required
- **JWT-based** session management
- **Rate limiting** (2 requests/second/user)
- **Role-based access** control

### File Management
- **Multi-file uploads** with drag & drop
- **MIME type validation** against file content
- **Advanced search** with multiple filters
- **Folder organization** (hierarchical)
- **Storage quotas** (10MB default, configurable)

### Sharing & Permissions
- **Public sharing** with download counters
- **Private files** (owner only)
- **User-specific sharing** with permissions
- **Share token** generation

## 🧪 Testing

```bash
# Backend tests
make test

# Frontend tests
make test-frontend

# Integration tests
make test-integration

# Test coverage
make test-coverage
```

## 🏭 Production Deployment

### Docker Production Build
```bash
make prod-build
make prod-up
```

### Manual Deployment
1. Build backend: `make build-backend`
2. Build frontend: `make build-frontend`
3. Run migrations: `make migrate-up`
4. Deploy with your preferred orchestrator

## 📈 Monitoring & Observability

- **Health checks** for all services
- **Structured logging** with Zap
- **Request tracing** and error handling
- **Storage statistics** and usage analytics
- **Audit logs** for compliance

## 🤝 Contributing

1. Follow the established architecture patterns
2. Write tests for new features
3. Use conventional commit messages
4. Update documentation as needed

## 📝 License

This project is part of the BalkanID internship program.

---


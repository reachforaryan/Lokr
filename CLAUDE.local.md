# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lokr** is a production-grade secure file vault system built for the BalkanID Full Stack Engineering Intern Capstone Task. It supports efficient storage, powerful search, controlled file sharing, and intelligent deduplication.

### Tech Stack
- **Backend**: Go (Golang) with Gin framework
- **API**: GraphQL (preferred over REST)
- **Database**: PostgreSQL with Redis caching
- **Frontend**: React.js with TypeScript
- **Storage**: AWS S3 with local fallback
- **Containerization**: Docker Compose

## Architecture Overview

The system follows a clean architecture pattern with these layers:
1. **Frontend Layer**: React + TypeScript with drag-and-drop uploads, advanced search UI, and admin dashboard
2. **API Gateway Layer**: Go Gin framework with GraphQL endpoints, authentication middleware, and rate limiting
3. **Business Logic Layer**: Core services (File, Deduplication, Search, Sharing, Statistics)
4. **Data Layer**: PostgreSQL for metadata, Redis for caching, AWS S3 for file storage

## Key Features Implementation

### File Deduplication
- Uses SHA-256 content hashing to detect duplicates
- Reference counting system - single physical file, multiple logical references
- Only deletes physical files when reference count reaches 0
- Provides storage savings analytics to users

### Authentication & Authorization
- **Primary**: Google OAuth 2.0 integration
- **Secondary**: Email/password with verification
- JWT-based authentication with refresh tokens
- Role-based access (USER/ADMIN)
- Rate limiting: 2 calls per second per user (configurable)

### File Management
- Multi-file uploads with progress tracking
- Drag-and-drop interface
- MIME type validation against file content
- Storage quotas: 10MB default per user (configurable)
- Streaming downloads for large files

### Search & Filtering
- Multi-criteria search: filename, MIME type, size range, date range, tags, uploader
- Optimized PostgreSQL queries with proper indexing
- Redis caching for search results
- Pagination support

### Sharing System
- Public sharing with download counters
- Private files (owner only)
- User-specific sharing with granular permissions (VIEW/DOWNLOAD/EDIT/DELETE)
- Share token generation for public access

## Backend Dependencies (Production-Grade)

### Core Framework
```go
github.com/gin-gonic/gin v1.9.1                    // Web framework
github.com/99designs/gqlgen v0.17.36                // GraphQL server
github.com/gin-contrib/cors v1.4.0                 // CORS middleware
```

### Database & Caching
```go
github.com/jackc/pgx/v5 v5.4.3                     // PostgreSQL driver
github.com/jackc/pgxpool/v5 v5.4.3                 // Connection pooling
github.com/redis/go-redis/v9 v9.2.1                // Redis client
github.com/golang-migrate/migrate/v4 v4.16.2        // Database migrations
```

### Authentication & Security
```go
github.com/golang-jwt/jwt/v5 v5.0.0                // JWT tokens
golang.org/x/oauth2 v0.12.0                        // Google OAuth
github.com/ulule/limiter/v3 v3.11.2                // Rate limiting
golang.org/x/crypto v0.13.0                        // Password hashing
```

### File Storage & Processing
```go
github.com/aws/aws-sdk-go-v2/service/s3 v1.38.5    // AWS S3
github.com/h2non/filetype v1.1.3                   // File type detection
github.com/google/uuid v1.3.1                      // UUID generation
```

### Utilities
```go
go.uber.org/zap v1.26.0                            // Structured logging
github.com/joho/godotenv v1.5.1                    // Environment variables
github.com/sendgrid/sendgrid-go v3.12.0            // Email service
```

## Frontend Dependencies (Production-Grade)

### Core & GraphQL
```json
{
  "react": "^18.2.0",
  "typescript": "^5.2.2",
  "@apollo/client": "^3.8.4",
  "@graphql-codegen/cli": "^5.0.0"
}
```

### UI Framework
```json
{
  "tailwindcss": "^3.3.3",
  "@headlessui/react": "^1.7.17",
  "@radix-ui/react-dialog": "^1.0.5",
  "framer-motion": "^10.16.4"
}
```

### File Handling & Visualization
```json
{
  "react-dropzone": "^14.2.3",
  "recharts": "^2.8.0",
  "d3": "^7.8.5"
}
```

## Database Schema Overview

### Core Tables
- `users`: User accounts with storage quotas and role information
- `files`: File metadata (filename, size, mime_type, content_hash, visibility)
- `file_contents`: Deduplicated file storage (content_hash, file_path, reference_count)
- `folders`: Hierarchical folder structure (optional feature)
- `file_shares`: Sharing permissions between users
- `audit_logs`: Activity tracking for compliance

### Key Indexes
- `files(content_hash)` for deduplication lookups
- `files(user_id, upload_date)` for user file listings
- `files(mime_type, size, upload_date)` for search filtering

## Development Commands

### Backend Development
```bash
# Start development server
go run cmd/server/main.go

# Run tests
go test ./...

# Generate GraphQL schema
go generate ./...

# Database migrations
migrate -path migrations -database $DATABASE_URL up

# Security scan
gosec ./...
```

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Generate GraphQL types
npm run codegen

# Lint and format
npm run lint
npm run format
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Rebuild services
docker-compose build
```

## Implementation Phases (10 Weeks)

1. **Foundation (Week 1-2)**: Docker setup, database schema, basic authentication
2. **Core Services (Week 3-4)**: File upload, deduplication engine, GraphQL API
3. **Advanced Features (Week 5-6)**: Search system, sharing permissions
4. **Frontend Development (Week 7-8)**: React UI, admin dashboard, real-time updates
5. **Production Ready (Week 9-10)**: Testing, documentation, deployment

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgres://user:pass@host:5432/lokr
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5

# Redis
REDIS_URL=redis://localhost:6379

# AWS S3
USE_S3=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=

# Authentication
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Rate Limiting & Quotas
DEFAULT_RATE_LIMIT=2  # requests per second
DEFAULT_STORAGE_QUOTA=10485760  # 10MB in bytes

# Email
SENDGRID_API_KEY=
```

## Security Considerations

- Input validation on all GraphQL inputs using `github.com/go-playground/validator/v10`
- File content validation against declared MIME types
- SQL injection prevention through parameterized queries
- Rate limiting per user and endpoint
- Audit logging for all file operations
- Secure JWT token handling with refresh rotation

## Performance Optimizations

- Database connection pooling (25 max connections for AWS RDS)
- Redis caching for search results and session data
- File streaming for large downloads
- Optimized SQL queries with proper indexing
- CDN integration for file downloads (future enhancement)

## Architecture Visualization

The project includes a D3.js visualization (`architecture-visualization.html`) that shows:
- System architecture with interactive components
- Authentication flow with Google OAuth
- GraphQL schema visualization
- Implementation phases timeline
- Dependency mapping

This visualization helps understand the complete system architecture and data flow.
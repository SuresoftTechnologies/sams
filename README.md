# SAMS (Suresoft Asset Management System)

A modern, full-stack asset management system built with FastAPI and React.

## 🎯 Project Overview

SAMS is a comprehensive asset management solution designed to help organizations track, manage, and maintain their physical assets efficiently. The system provides features for asset registration, tracking, assignment, maintenance scheduling, and reporting.

## 🏗️ Architecture

This is a monorepo project using Turborepo, containing:

- **Backend**: FastAPI (Python 3.12) with PostgreSQL and Redis
- **Frontend**: React 19 with TypeScript, Vite, and Tailwind CSS
- **Shared Packages**: Type-safe API client and shared TypeScript types

```
suresoft-ams/
├── apps/
│   ├── backend/          # FastAPI backend
│   └── frontend/         # React frontend
├── packages/
│   ├── api-client/       # Auto-generated TypeScript API client
│   ├── shared-types/     # Shared TypeScript types
│   └── config/           # Shared configuration
└── docs/                 # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Python 3.12
- PostgreSQL 15
- Redis 7

### Installation

```bash
# Clone repository
git clone <repository-url>
cd suresoft-ams

# Install dependencies
pnpm install

# Setup backend
cd apps/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
pnpm db:setup  # Start DB, run migrations, seed data

# Start development servers (from root)
pnpm dev
```

The services will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📚 Documentation

- [Setup Guide](docs/SETUP_GUIDE.md)
- [Backend Setup](docs/BACKEND_SETUP.md)
- [Frontend Setup](docs/FRONTEND_SETUP_GUIDE.md)
- [Architecture Documentation](docs/architecture/README.md)
- [API Documentation](http://localhost:8000/docs) (when running)

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.109+
- **Language**: Python 3.12
- **ORM**: SQLAlchemy 2.0 + Alembic
- **Validation**: Pydantic v2
- **Auth**: JWT (python-jose)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7

### Frontend
- **Framework**: React 19
- **Language**: TypeScript 5.3
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**:
  - TanStack Query 5 (server state)
  - Zustand 5 (client state)
- **Forms**: React Hook Form 7 + Zod 4
- **Routing**: React Router 7

### Monorepo
- **Build System**: Turborepo
- **Package Manager**: pnpm (workspaces)

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all apps in dev mode
pnpm dev:frontend     # Start frontend only
pnpm dev:backend      # Start backend only

# Build
pnpm build            # Build all packages
pnpm build:frontend   # Build frontend only
pnpm build:backend    # Build backend only

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode

# Linting & Formatting
pnpm lint             # Lint all packages
pnpm format           # Format all files
pnpm format:check     # Check formatting
pnpm typecheck        # Type check all packages

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed initial data
pnpm db:reset         # Reset and re-migrate
pnpm db:setup         # Full DB setup (start + migrate + seed)

# Cleanup
pnpm clean            # Clean all build artifacts
```

## 🔄 Type Synchronization

The project maintains type safety across the stack:

1. Backend defines Pydantic schemas (`src/schemas/`)
2. FastAPI generates OpenAPI spec
3. `pnpm generate:openapi` exports spec to `@sams/api-client`
4. TypeScript types are auto-generated
5. Frontend imports types from `@sams/api-client`

```typescript
// Frontend automatically has type-safe access to backend
import type { components } from '@sams/api-client';

type Asset = components['schemas']['Asset'];
type CreateAssetDto = components['schemas']['CreateAssetDto'];
```

## 📦 Key Features

- **Asset Management**: Track assets with tags, categories, locations
- **Assignment System**: Assign assets to employees with history
- **QR Code Support**: Generate and scan QR codes for assets
- **Status Tracking**: Monitor asset status (available, assigned, maintenance, etc.)
- **Grade System**: Automatic asset grading based on age (A/B/C)
- **Role-Based Access**: Admin, Manager, and Employee roles
- **JWT Authentication**: Secure access with refresh tokens
- **Responsive UI**: Mobile-friendly interface
- **Real-time Updates**: Optimistic updates with TanStack Query

## 🔐 Authentication

The system uses JWT-based authentication:

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Roles**: Admin, Manager, Employee

## 🗄️ Database Schema

Key entities:
- **Assets**: Main asset records with metadata
- **Categories**: Asset categorization
- **Locations**: Physical locations
- **Users**: System users with roles
- **Asset History**: Audit trail for all changes

## 📝 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

[License information]

## 👥 Team

Developed by the Suresoft Team.

---

**Project**: SAMS (Suresoft Asset Management System)
**Version**: 1.0.0
**Status**: Active Development

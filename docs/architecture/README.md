# Architecture Documentation

Welcome to the SAMS (Suresoft Asset Management System) architecture documentation.

## 📚 Documentation Index

### Core Architecture Documents

1. **[Overview](./00-overview.md)** - 아키텍처 개요 및 기술 스택
   - Executive Summary
   - Architecture Principles
   - Technology Stack
   - Project Roadmap

2. **[System Context](./01-system-context.md)** - C4 Model Level 1
   - Actors and External Systems
   - System Boundaries
   - Key Interactions
   - Trust Boundaries

3. **[Container Architecture](./02-container-architecture.md)** - C4 Model Level 2
   - Application Containers
   - Data Stores
   - Inter-Container Communication
   - Technology Decisions

4. **[Data Architecture](./04-data-architecture.md)** - 데이터베이스 설계
   - Entity Relationship Diagram
   - Schema Definitions
   - Indexing Strategy
   - Data Migration Plan

5. **[Security Architecture](./05-security-architecture.md)** - 보안 설계
   - Authentication & Authorization
   - Data Protection
   - Network Security
   - Threat Modeling

6. **[Deployment Architecture](./06-deployment-architecture.md)** - 배포 및 인프라
   - Environment Strategy
   - Docker & Kubernetes
   - CI/CD Pipeline
   - Monitoring & Observability

### Architecture Decision Records (ADRs)

- **[ADR-0001: Technology Stack Selection](./adr/0001-technology-stack-selection.md)**
  - Why React, NestJS, PostgreSQL
  - Alternatives Considered
  - Trade-offs

- **[ADR-0002: Database Selection](./adr/0002-database-selection.md)**
  - PostgreSQL Rationale
  - Configuration Details
  - Backup Strategy

- **[ADR-0003: Authentication Strategy](./adr/0003-authentication-strategy.md)**
  - JWT-Based Authentication
  - Token Management
  - Security Best Practices

## 🎯 How to Use This Documentation

### For New Team Members
1. Start with [Overview](./00-overview.md) to understand the big picture
2. Read [System Context](./01-system-context.md) to see how the system interacts with users and external systems
3. Review [Container Architecture](./02-container-architecture.md) to understand the technical components

### For Developers
1. Check [Container Architecture](./02-container-architecture.md) for API and service design
2. Review [Data Architecture](./04-data-architecture.md) for database schema
3. Consult [Security Architecture](./05-security-architecture.md) for security implementation

### For DevOps Engineers
1. Study [Deployment Architecture](./06-deployment-architecture.md) for infrastructure setup
2. Review [Container Architecture](./02-container-architecture.md) for service dependencies
3. Check ADRs for technology-specific decisions

### For Security Reviewers
1. Read [Security Architecture](./05-security-architecture.md) thoroughly
2. Review [ADR-0003: Authentication Strategy](./adr/0003-authentication-strategy.md)
3. Check [Data Architecture](./04-data-architecture.md) for data protection measures

## 📊 Diagram Legend

### Mermaid Diagrams
All architecture diagrams are created using Mermaid.js and can be viewed in GitHub or any Markdown viewer that supports Mermaid.

**Color Coding:**
- 🟦 Blue: Application Layer
- 🟧 Orange: Data Layer
- 🟪 Purple: Infrastructure Layer
- 🟩 Green: External Systems
- 🟥 Red: Security/Monitoring

### C4 Model Levels
- **Level 1**: System Context - How the system fits into the world
- **Level 2**: Container - High-level technology choices
- **Level 3**: Component - Components within containers
- **Level 4**: Code - Detailed class diagrams (not included in initial docs)

## 🔄 Documentation Maintenance

### Update Frequency
- **Architecture Documents**: As needed (major changes)
- **ADRs**: When architectural decisions are made
- **Diagrams**: Keep in sync with code changes

### Review Process
1. Propose changes via Pull Request
2. Technical review by architecture team
3. Approval by Tech Lead
4. Merge and publish

### Version Control
All architecture documents are versioned with the project. Check the "Version History" section at the bottom of each document.

## 🎓 Additional Resources

### Internal Resources
- [Main README](../../README.md) - Project setup and quick start
- [API Documentation](./api/) - REST API specifications
- [Development Guide](../../IMPLEMENTATION_GUIDE.md) - Implementation details

### External Resources
- [C4 Model](https://c4model.com/) - Architecture diagramming
- [ADR Template](https://github.com/joelparkerhenderson/architecture-decision-record) - ADR best practices
- [NestJS Documentation](https://docs.nestjs.com/) - Backend framework
- [React Documentation](https://react.dev/) - Frontend framework
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database

## 📝 Contributing to Documentation

### Writing Guidelines
- Use clear, concise language
- Include diagrams where appropriate
- Add code examples for complex concepts
- Link to related documents
- Update version history

### Mermaid Diagram Tips
```markdown
```mermaid
graph TB
    A[Component A] -->|Action| B[Component B]
```​```

### ADR Template
Use the [ADR Template](./adr/template.md) for new architectural decisions.

## 🔗 Quick Links

| Document | Purpose | Target Audience |
|----------|---------|-----------------|
| [Overview](./00-overview.md) | Big picture | Everyone |
| [System Context](./01-system-context.md) | External interactions | Developers, PMs |
| [Container Architecture](./02-container-architecture.md) | Technical design | Developers, DevOps |
| [Data Architecture](./04-data-architecture.md) | Database schema | Backend Developers |
| [Security Architecture](./05-security-architecture.md) | Security design | Security Team, Developers |
| [Deployment Architecture](./06-deployment-architecture.md) | Infrastructure | DevOps, SRE |

## 💬 Feedback

If you have questions or suggestions about this documentation:
- Open an issue on GitHub
- Contact the architecture team
- Propose changes via Pull Request

---

**Last Updated**: 2025-10-29
**Maintained By**: Architecture Team

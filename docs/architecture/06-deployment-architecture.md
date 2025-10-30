# Deployment Architecture

## 📋 Overview

이 문서는 자산관리 시스템(AMS)의 배포 아키텍처를 설명합니다. 개발, 스테이징, 프로덕션 환경의 인프라, CI/CD 파이프라인, 모니터링 전략을 다룹니다.

## 🏗️ Environment Strategy

### Environment Tiers

| Environment  | Purpose                  | Access           | Update Frequency |
|--------------|--------------------------|------------------|------------------|
| **Local**    | 개발자 로컬 환경          | 개발자           | 실시간           |
| **Development**| 통합 테스트              | 개발팀           | 매 커밋          |
| **Staging**  | 프로덕션 사전 검증        | QA팀, 운영팀     | 일 1회           |
| **Production**| 실제 서비스              | 전 직원          | 주 1회           |

## 🐳 Container Architecture

### Docker Compose (Local/Development)

```yaml
# docker-compose.yml
version: '3.9'

services:
  # Frontend
  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:4000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - api

  # Backend API
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://ams:password@postgres:5432/ams
      - REDIS_URL=redis://redis:6379
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    command: npm run start:dev

  # Background Worker
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://ams:password@postgres:5432/ams
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    command: npm run worker:dev

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=ams
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=ams
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # MinIO Object Storage
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - web
      - api

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Dockerfile Examples

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm ci --only=production

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Non-root 사용자로 실행
USER node

EXPOSE 4000

CMD ["node", "dist/main.js"]
```

## ☸️ Kubernetes Architecture (Production)

### Cluster Overview

```mermaid
graph TB
    subgraph "Ingress"
        ING[Ingress Controller<br/>Nginx]
    end

    subgraph "Application Namespace"
        WEB[Web Deployment<br/>3 replicas]
        API[API Deployment<br/>3 replicas]
        WORKER[Worker Deployment<br/>2 replicas]
    end

    subgraph "Data Namespace"
        PG[PostgreSQL StatefulSet<br/>Primary + 2 Replicas]
        REDIS[Redis StatefulSet]
        MINIO[MinIO StatefulSet]
    end

    subgraph "Monitoring Namespace"
        PROM[Prometheus]
        GRAF[Grafana]
        LOKI[Loki]
    end

    ING -->|Route /| WEB
    ING -->|Route /api| API
    API --> PG
    API --> REDIS
    API --> MINIO
    WORKER --> PG
    WORKER --> REDIS

    PROM -.->|Scrape| WEB
    PROM -.->|Scrape| API
    PROM -.->|Scrape| WORKER
    GRAF -.->|Query| PROM
    LOKI -.->|Logs| API

    classDef ingress fill:#f9d71c,stroke:#f47e20,color:#000
    classDef app fill:#326ce5,stroke:#1a4d8f,color:#fff
    classDef data fill:#00758f,stroke:#004d61,color:#fff
    classDef monitor fill:#ff6b6b,stroke:#c92a2a,color:#fff

    class ING ingress
    class WEB,API,WORKER app
    class PG,REDIS,MINIO data
    class PROM,GRAF,LOKI monitor
```

### Kubernetes Manifests

#### API Deployment
```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ams-api
  namespace: ams
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ams-api
  template:
    metadata:
      labels:
        app: ams-api
    spec:
      containers:
      - name: api
        image: ams-api:latest
        ports:
        - containerPort: 4000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ams-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: ams-secrets
              key: redis-url
        - name: JWT_ACCESS_SECRET
          valueFrom:
            secretKeyRef:
              name: ams-secrets
              key: jwt-access-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 4000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ams-api-service
  namespace: ams
spec:
  selector:
    app: ams-api
  ports:
  - protocol: TCP
    port: 4000
    targetPort: 4000
  type: ClusterIP
```

#### PostgreSQL StatefulSet
```yaml
# k8s/postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: ams
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secrets
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secrets
              key: password
        - name: POSTGRES_DB
          value: "ams"
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
      storageClassName: ssd
```

#### Ingress
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ams-ingress
  namespace: ams
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - ams.suresoft.com
    secretName: ams-tls
  rules:
  - host: ams.suresoft.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: ams-api-service
            port:
              number: 4000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ams-web-service
            port:
              number: 80
```

#### HorizontalPodAutoscaler
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ams-api-hpa
  namespace: ams
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ams-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 테스트 작업
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  # 보안 스캔
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run npm audit
        run: npm audit --audit-level=high

  # Docker 이미지 빌드 및 푸시
  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            ghcr.io/suresoft/ams-api:latest
            ghcr.io/suresoft/ams-api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Web
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: |
            ghcr.io/suresoft/ams-web:latest
            ghcr.io/suresoft/ams-web:${{ github.sha }}

  # Kubernetes 배포
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubeconfig
        run: |
          echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/ams-api \
            api=ghcr.io/suresoft/ams-api:${{ github.sha }} \
            -n ams
          kubectl set image deployment/ams-web \
            web=ghcr.io/suresoft/ams-web:${{ github.sha }} \
            -n ams

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/ams-api -n ams
          kubectl rollout status deployment/ams-web -n ams

      - name: Run smoke tests
        run: |
          curl -f https://ams.suresoft.com/health || exit 1
```

### Deployment Strategy

#### Blue-Green Deployment
```yaml
# 현재 프로덕션 (Green)
kubectl get svc ams-api-service -o yaml

# 새 버전 배포 (Blue)
kubectl apply -f ams-api-blue-deployment.yaml

# 트래픽 전환
kubectl patch svc ams-api-service -p '{"spec":{"selector":{"version":"blue"}}}'

# 이전 버전 (Green) 삭제
kubectl delete deployment ams-api-green
```

#### Canary Deployment
```yaml
# 90% 기존 버전, 10% 새 버전
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: ams-api
spec:
  hosts:
  - ams-api-service
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: ams-api-service
        subset: v2
  - route:
    - destination:
        host: ams-api-service
        subset: v1
      weight: 90
    - destination:
        host: ams-api-service
        subset: v2
      weight: 10
```

## 📊 Monitoring & Observability

### Prometheus Metrics

```yaml
# Metrics to collect
- name: http_requests_total
  type: counter
  labels: [method, path, status_code]

- name: http_request_duration_seconds
  type: histogram
  labels: [method, path]

- name: database_query_duration_seconds
  type: histogram
  labels: [query_type]

- name: active_users
  type: gauge

- name: cache_hit_rate
  type: gauge
```

### Grafana Dashboards

#### Application Dashboard
- Request Rate (RPS)
- Response Time (P50, P95, P99)
- Error Rate (4xx, 5xx)
- Active Users
- Database Connections

#### Infrastructure Dashboard
- CPU Usage (per pod)
- Memory Usage (per pod)
- Disk I/O
- Network Traffic
- Pod Restarts

### Logging Stack (ELK)

```yaml
# Fluentd DaemonSet
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch
        env:
        - name: FLUENT_ELASTICSEARCH_HOST
          value: "elasticsearch.monitoring.svc.cluster.local"
        - name: FLUENT_ELASTICSEARCH_PORT
          value: "9200"
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

### Alerting Rules

```yaml
# Prometheus AlertManager
groups:
- name: ams_alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "P95 response time > 1s"

  - alert: DatabaseConnectionPoolExhausted
    expr: pg_stat_activity_count > 90
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Database connection pool near limit"
```

## 🔒 Secrets Management

### Kubernetes Secrets

```bash
# Create secrets
kubectl create secret generic ams-secrets \
  --from-literal=database-url='postgresql://...' \
  --from-literal=redis-url='redis://...' \
  --from-literal=jwt-access-secret='...' \
  -n ams

# Seal secrets (for GitOps)
kubeseal --format=yaml < ams-secrets.yaml > ams-sealed-secrets.yaml
```

### External Secrets Operator (Recommended)

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ams-secrets
  namespace: ams
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: ams-secrets
  data:
  - secretKey: database-url
    remoteRef:
      key: ams/production/database-url
  - secretKey: jwt-access-secret
    remoteRef:
      key: ams/production/jwt-access-secret
```

## 📈 Scaling Strategy

### Vertical Scaling
- **API Server**: 256Mi → 512Mi → 1Gi
- **PostgreSQL**: 1Gi → 2Gi → 4Gi

### Horizontal Scaling
- **API Server**: 3 → 5 → 10 pods (HPA)
- **Worker**: 2 → 4 → 8 pods

### Database Scaling
- **Read Replicas**: 2개 (읽기 부하 분산)
- **Connection Pooling**: PgBouncer (100 → 200 connections)

## 🔗 Related Documents
- [Container Architecture](./02-container-architecture.md)
- [Security Architecture](./05-security-architecture.md)
- [ADR-0001: Technology Stack](./adr/0001-technology-stack-selection.md)

## 📝 Version History

| Version | Date       | Author            | Changes                |
|---------|------------|-------------------|------------------------|
| 1.0.0   | 2025-10-29 | DevOps Team       | Initial version        |

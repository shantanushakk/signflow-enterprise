<<<<<<< HEAD
# ✦ SignFlow Enterprise

> A production-ready, enterprise-grade eSignature platform — open-source alternative to DocuSign.
> Built with React 18 + Vite. Deploy-ready in under 5 minutes.

---

## 📋 Table of Contents

- [Live Features](#-live-features)
- [Quick Start](#-quick-start-5-minutes)
- [Project Structure](#-project-structure)
- [Demo Credentials](#-demo-credentials)
- [Guest Mode](#-guest-mode-logic)
- [Deployment](#-deployment)
- [Full Enterprise Stack Roadmap](#-full-enterprise-stack-roadmap)
- [Tech Stack](#-tech-stack)

---

## ✅ Live Features

| Module | What's Built |
|---|---|
| 🏠 Landing Page | Marketing hero, feature grid, stats, CTAs |
| 🔓 Guest Mode | 2 free actions before login wall |
| 🔐 Auth | Login + Signup with demo credentials |
| 📊 Dashboard | Overview with stats, quick actions, recent docs |
| 📄 Documents | Full CRUD table — search, filter by status, send, sign, delete |
| 📝 PDF Builder | Drag-and-drop signature field placement on PDF canvas |
| ✍️ Signature Modal | Draw (canvas), Type (3 fonts), Upload tabs |
| 📨 Send Document | 3-step wizard — recipients, message, review & send |
| 🗂️ Templates | Template library with categories and use counts |
| 🔄 Workflows | Sequential & parallel signing workflow management |
| 🔍 Audit Trail | Tamper-proof log table with IP, timestamp, browser |
| 👥 Team | Member management with roles and permissions |
| ⚙️ Settings | Org, profile, security, notifications, billing, compliance |
| 👤 Profile | User card with plan info and sign-out |

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- npm 9+ (comes with Node)

### 1. Clone / Download

```bash
# If using git
git clone https://github.com/your-org/signflow-enterprise.git
cd signflow-enterprise

# OR just unzip the downloaded folder and cd into it
cd signflow-enterprise
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app opens automatically.

### 4. Build for Production

```bash
npm run build
# Output goes to /dist — ready to deploy anywhere
```

### 5. Preview Production Build Locally

```bash
npm run preview
# Opens http://localhost:4173
```

---

## 📁 Project Structure

```
signflow-enterprise/
├── public/
│   └── favicon.svg             # App icon
├── src/
│   ├── main.jsx                # React entry point
│   └── App.jsx                 # ← Entire application (all components)
├── index.html                  # HTML shell + Google Fonts
├── vite.config.js              # Vite bundler config
├── package.json                # Dependencies & scripts
├── .env.example                # Environment variable template
├── .gitignore
└── README.md
```

**Single-file architecture** — all components live in `src/App.jsx` for easy portability. As you scale, split into:

```
src/
├── components/
│   ├── ui/              # Modal, Toast, StatusBadge
│   ├── landing/         # LandingPage
│   ├── auth/            # AuthPage
│   ├── dashboard/       # Dashboard, Sidebar, Topbar
│   ├── documents/       # DocumentsTable, PDFBuilderModal
│   ├── signature/       # SignatureModal
│   ├── workflow/        # SendDocModal, WorkflowView
│   ├── audit/           # AuditTrail
│   ├── team/            # TeamTable
│   └── settings/        # SettingsGrid
├── hooks/               # useAuth, useDocuments, useToast
├── store/               # Zustand stores
├── api/                 # Axios API clients
├── types/               # TypeScript interfaces (when you migrate)
└── utils/               # Helpers, formatters
```

---

## 🔑 Demo Credentials

| Field | Value |
|---|---|
| Email | `demo@signflow.io` |
| Password | `demo123` |
| Role | Admin |
| Plan | Pro |

---

## 👤 Guest Mode Logic

Every new visitor gets **2 free actions** before being redirected to login:

| Action # | What triggers it |
|---|---|
| Action 1 | Create Signature (draw/type/upload modal) |
| Action 2 | Send for Signing (3-step wizard) |
| After 2 | Redirect to Auth page with upsell |

To change the limit, edit line in `App.jsx`:
```js
const MAX_GUEST = 2; // Change to any number
```

---

## 🌐 Deployment

### Option A — Vercel (Recommended, Free)

```bash
npm install -g vercel
vercel
# Follow prompts — auto-detects Vite, deploys in ~30 seconds
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) — auto-deploys on every push.

### Option B — Netlify

```bash
npm run build
# Drag-and-drop the /dist folder at app.netlify.com/drop
```

Or via CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option C — AWS S3 + CloudFront

```bash
npm run build

# Upload dist/ to S3 bucket
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### Option D — Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t signflow .
docker run -p 80:80 signflow
```

### nginx.conf (for Docker / VPS)

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # React SPA — redirect all routes to index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(js|css|png|svg|ico|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
```

---

## 🏗️ Full Enterprise Stack Roadmap

This frontend is Phase 1. Here's how to build the complete production system:

### Phase 1 — MVP Frontend ✅ (This repo)
- React + Vite SPA
- All UI components built
- Mock data — no real backend yet
- Deploy to Vercel/Netlify

### Phase 2 — Add Real Backend (2–3 months)

**NestJS + PostgreSQL + Redis**

```bash
# Scaffold NestJS backend
npm install -g @nestjs/cli
nest new signflow-api
cd signflow-api

# Core modules to generate
nest g module auth
nest g module documents
nest g module signatures
nest g module workflows
nest g module audit
nest g module organizations
nest g module notifications
```

**Database (PostgreSQL + Prisma)**:
```bash
npm install prisma @prisma/client
npx prisma init
```

Key schema tables:
```prisma
model Organization { id, name, domain, plan, createdAt }
model User         { id, orgId, email, name, role, hashedPassword }
model Document     { id, orgId, ownerId, name, s3Key, status, pages }
model SignatureField{ id, documentId, type, x, y, width, height, page, signerId }
model Signer       { id, documentId, email, name, order, status, signedAt }
model AuditLog     { id, documentId, userId, action, ip, userAgent, createdAt }
model Template     { id, orgId, name, category, fields }
```

**File Storage (AWS S3)**:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**PDF Processing**:
```bash
npm install pdf-lib pdfjs-dist
```

**Email (SendGrid)**:
```bash
npm install @sendgrid/mail
```

**Queue (BullMQ + Redis)**:
```bash
npm install bullmq ioredis
# Queues: email-queue, pdf-queue, audit-queue
```

### Phase 3 — SaaS Features (3–4 months)

- **Auth**: Replace mock auth with Auth0 or custom JWT + refresh tokens
- **Billing**: Stripe integration for Free/Pro/Enterprise plans
- **SSO**: SAML 2.0 / OIDC for enterprise customers (use `passport-saml`)
- **Multi-tenant isolation**: Row-level security in PostgreSQL
- **Webhooks**: Outbound webhooks on document events
- **API**: Public REST API with API key management

### Phase 4 — Enterprise Scale (6–12 months)

- **Kubernetes**: EKS cluster with auto-scaling
- **CDN**: CloudFront for PDF/asset delivery
- **Observability**: Datadog / Grafana + Prometheus
- **Compliance**: SOC 2 Type II audit, eIDAS, ESIGN Act
- **PKI**: Digital certificates for advanced electronic signatures
- **AI**: AWS Textract / OpenAI for smart field detection

---

## 🛠️ Tech Stack

### Current (This repo)
| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Bundler | Vite 5 |
| Styling | Inline styles (zero CSS deps) |
| State | React useState / props |
| Canvas | HTML5 Canvas API (signature drawing) |
| Fonts | Google Fonts (Inter, Dancing Script) |

### Recommended Full Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Next.js 14 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + TanStack Query |
| Backend | NestJS + Node.js |
| Database | PostgreSQL + Prisma ORM |
| Cache/Queue | Redis + BullMQ |
| File Storage | AWS S3 |
| PDF | pdf-lib + PDF.js |
| Auth | Auth0 (or custom JWT) |
| Email | SendGrid |
| Infrastructure | AWS ECS/EKS + RDS + ElastiCache |
| CI/CD | GitHub Actions + Docker |
| Monitoring | Datadog + Sentry |

---

## 🔒 Security Checklist (Production)

- [ ] HTTPS everywhere (TLS 1.3)
- [ ] JWT with short expiry (15 min) + refresh tokens (7 days)
- [ ] Rate limiting on all API endpoints (express-rate-limit / NestJS throttler)
- [ ] CSRF protection
- [ ] XSS prevention (CSP headers)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] Document URLs signed (S3 presigned URLs, 15 min expiry)
- [ ] Audit log hash chain (SHA-256 tamper detection)
- [ ] MFA/2FA support (TOTP)
- [ ] Dependency scanning (npm audit, Dependabot)
- [ ] Secrets in env vars only — never in code

---

## 📄 License

MIT — free to use, modify, and deploy commercially.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

**Built with ❤️ for the enterprise developer community.**
=======
# signflow-enterprise
>>>>>>> 03170fae53771c79ac125cb2d90e8f77bb8baa3f


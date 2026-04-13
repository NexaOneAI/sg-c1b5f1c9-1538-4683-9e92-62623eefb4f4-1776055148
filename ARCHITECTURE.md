# 🏗️ Arquitectura - Nexa One

Documentación técnica completa del sistema Nexa One - Plataforma SaaS de construcción de aplicaciones web mediante IA.

## 📋 Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Base de Datos](#base-de-datos)
4. [Flujos de Negocio](#flujos-de-negocio)
5. [Integraciones Externas](#integraciones-externas)
6. [Seguridad](#seguridad)
7. [Performance](#performance)

---

## 🛠️ Stack Tecnológico

### Frontend
- Framework: Next.js 15 (Page Router)
- UI: React 18.3 + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Fonts: Orbitron (headings) + Inter (body)
- State: React Hooks + Context API
- Icons: Lucide React

### Backend
- Runtime: Node.js 18+
- API Routes: Next.js API Routes
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (JWT)
- ORM: Supabase Client SDK

### Integraciones
- IA: OpenAI GPT-4 + Claude 3.5
- Git: GitHub OAuth + GitHub API
- Deploy: Vercel API
- DNS: NSOne (wildcard)

### DevOps
- Hosting: Vercel
- CDN: Vercel Edge Network
- SSL: Let's Encrypt (automático)
- CI/CD: Vercel Git Integration

---

## 📁 Estructura de Carpetas

```
nexa-one/
├── src/
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── auth/           # AuthGuard
│   │   └── builder/        # Chat, Preview, FileExplorer
│   ├── pages/
│   │   ├── api/            # API Routes
│   │   ├── auth/           # Login, Register
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── builder/        # Editor de proyectos
│   │   ├── admin/          # Panel admin
│   │   └── profile/        # Perfil de usuario
│   ├── services/           # Business Logic
│   └── integrations/       # Supabase, etc.
├── public/                 # Assets estáticos
├── supabase/
│   └── migrations/         # SQL migrations
└── docs/
    ├── DEPLOY.md
    ├── VERIFICATION.md
    └── ARCHITECTURE.md
```

---

## 🗄️ Base de Datos

### Tablas Principales

1. profiles - Usuarios extendidos de Supabase Auth
2. credit_wallets - Créditos por usuario
3. credit_transactions - Historial de transacciones
4. subscriptions - Planes activos
5. projects - Proyectos del usuario
6. project_files - Código de los proyectos
7. project_versions - Historial de versiones
8. conversations - Chats IA
9. conversation_messages - Mensajes del chat
10. github_connections - Tokens OAuth GitHub
11. deployment_logs - Historial de deploys
12. admin_settings - Configuración global

### Relaciones Clave

- profiles 1:1 credit_wallets
- profiles 1:1 subscriptions
- profiles 1:N projects
- projects 1:N project_files
- projects 1:N conversations
- profiles 1:1 github_connections
- projects 1:N deployment_logs

---

## 🔄 Flujos de Negocio

### Registro de Usuario

1. Usuario completa formulario
2. Supabase Auth crea cuenta
3. Trigger SQL automático:
   - Crea profile
   - Crea credit_wallet (100 créditos)
   - Crea subscription (plan Free)
4. Redirect a dashboard

### Generación de Código IA

1. Usuario escribe en chat
2. Frontend verifica sesión
3. POST a /api/ai/generate con token
4. API verifica créditos
5. Llama a OpenAI/Claude
6. Descuenta créditos
7. Guarda archivos en project_files
8. Crea project_version
9. Return código al frontend
10. Preview se actualiza

### Conectar GitHub

1. Click en "Conectar GitHub"
2. Redirect a GitHub OAuth
3. Usuario autoriza
4. Callback con code
5. Intercambio por access_token
6. Guardar en github_connections
7. Listar repositorios

### Push a GitHub

1. Usuario escribe commit message
2. POST a /api/github/push
3. API obtiene archivos del proyecto
4. GitHub API: Create/Update files
5. GitHub API: Create commit
6. Return URL del commit

### Deploy a Vercel

1. Usuario configura subdominio
2. Verificación de disponibilidad
3. POST a /api/deployments/create
4. Vercel API: Create deployment
5. Vercel API: Add custom domain
6. Guardar deployment_log
7. Actualizar project.deployment_url
8. DNS wildcard resuelve
9. SSL automático en 15-30 min

---

## 🔌 Integraciones Externas

### OpenAI GPT-4
- Endpoint: api.openai.com/v1/chat/completions
- Modelo: gpt-4-turbo-preview
- Costo: 10 créditos por generación
- Max tokens: 4000

### Claude 3.5 (Opcional)
- Endpoint: api.anthropic.com/v1/messages
- Modelos: Sonnet (20 créditos), Opus (40 créditos)
- Max tokens: 4000

### GitHub API
- OAuth: github.com/login/oauth/authorize
- Repos: api.github.com/user/repos
- Contents: api.github.com/repos/{owner}/{repo}/contents
- Commits: api.github.com/repos/{owner}/{repo}/git/commits

### Vercel API
- Deployments: api.vercel.com/v13/deployments
- Domains: api.vercel.com/v9/projects/{id}/domains
- Autenticación: Bearer token

### Supabase
- Auth: JWT tokens (1h validez)
- Database: PostgreSQL con RLS
- Client SDK: @supabase/supabase-js
- Server SDK: Custom con auth token

---

## 🔒 Seguridad

### Autenticación
- Supabase JWT tokens
- Session storage en cookies
- Auto-refresh de tokens
- RLS policies en todas las tablas

### RLS Policies

profiles:
- SELECT: auth.uid() = id OR admin
- UPDATE: auth.uid() = id

credit_wallets:
- SELECT: auth.uid() = user_id OR admin
- UPDATE: solo admin

projects:
- SELECT: auth.uid() = owner_id OR admin
- INSERT/UPDATE/DELETE: auth.uid() = owner_id

### Secrets Management
- Variables en .env.local
- Vercel Environment Variables
- GitHub tokens encriptados en DB
- Service role key solo en backend

---

## ⚡ Performance

### Frontend
- Code splitting con dynamic imports
- Image optimization (Next.js)
- Tailwind JIT compilation
- Critical CSS inline

### Backend
- Database indexes en user_id, project_id
- Query pagination
- Supabase connection pooling
- API response compression

### CDN
- Vercel Edge Network (100+ regiones)
- Static files en edge
- Automatic DDoS protection
- DNS con Anycast (NSOne)

### Monitoring
- Vercel Analytics (RUM)
- Web Vitals tracking
- Database performance (Supabase)
- Error tracking

---

## 📊 Métricas Objetivo

Performance:
- TTFB: < 200ms
- FCP: < 1.5s
- LCP: < 2.5s
- CLS: < 0.1

Availability:
- Uptime: 99.9%
- API Response: < 500ms (p95)
- DB Query: < 100ms (p95)

User Experience:
- IA Generation: 5-10s
- GitHub Push: < 30s
- Deploy: 2-3 min
- Page Load: < 2s

---

## 🚀 Deployment Pipeline

1. Push a GitHub
2. Vercel detecta commit
3. Build automático
4. Deploy a preview URL
5. Production deploy (main branch)
6. Edge propagation
7. Live en < 30 segundos

---

## 🔮 Roadmap

- [ ] Pagos (Stripe/Mercado Pago)
- [ ] Colaboración en tiempo real
- [ ] Templates de proyectos
- [ ] Marketplace de componentes
- [ ] CI/CD personalizado
- [ ] A/B testing integrado
- [ ] Analytics avanzados
- [ ] Mobile app (React Native)

---

Última actualización: 2026-04-13
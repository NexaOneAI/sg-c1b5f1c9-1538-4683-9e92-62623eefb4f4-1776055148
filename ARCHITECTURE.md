# Nexa One - Documentación de Arquitectura 🏗️

## 📐 Visión General

Nexa One es una plataforma SaaS full-stack construida con arquitectura moderna, escalable y lista para producción. Este documento detalla las decisiones técnicas, patrones de diseño y flujos del sistema.

---

## 🎯 Principios de Diseño

### 1. **Separation of Concerns**
- Frontend: React components puros, sin lógica de negocio
- Services: Toda la lógica de API y base de datos
- API Routes: Endpoints serverless para operaciones complejas

### 2. **Type Safety**
- TypeScript estricto en todo el proyecto
- Tipos generados automáticamente desde Supabase
- Interfaces explícitas para todos los servicios

### 3. **Security First**
- Row Level Security (RLS) en todas las tablas
- Autenticación con Supabase Auth
- API routes protegidas con verificación de sesión
- Validación de permisos por rol

### 4. **Performance**
- Server-Side Rendering (SSR) con Next.js
- Code splitting automático
- Optimización de imágenes con Next/Image
- Lazy loading de componentes pesados

---

## 🗄️ Arquitectura de Base de Datos

### Modelo de Datos

```
Users (Supabase Auth)
  ↓
Profiles (1:1)
  ├── Projects (1:N)
  │   ├── Project Versions (1:N)
  │   ├── Project Files (1:N)
  │   └── Conversations (1:1)
  │       └── Messages (1:N)
  ├── Credit Wallet (1:1)
  │   └── Credit Transactions (1:N)
  ├── Subscription (1:1)
  └── Payments (1:N)
```

### Tablas Principales

#### 1. **profiles**
```sql
- id (UUID, PK, FK → auth.users)
- email (TEXT, UNIQUE)
- full_name (TEXT)
- avatar_url (TEXT)
- role (ENUM: user, admin, superadmin)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**RLS Policies:**
- SELECT: Usuarios ven su propio perfil, admins ven todos
- UPDATE: Solo el propio usuario puede actualizar su perfil
- Admins tienen acceso completo

#### 2. **projects**
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- name (TEXT)
- description (TEXT)
- status (ENUM: active, archived, deleted)
- deployment_url (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**RLS Policies:**
- Usuarios solo ven/modifican sus propios proyectos
- Admins tienen acceso completo

#### 3. **credit_wallets**
```sql
- id (UUID, PK)
- user_id (UUID, UNIQUE, FK → profiles)
- balance (INTEGER, DEFAULT 100)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Trigger:** Auto-create wallet al crear profile

#### 4. **credit_transactions**
```sql
- id (UUID, PK)
- wallet_id (UUID, FK → credit_wallets)
- user_id (UUID, FK → profiles)
- amount (INTEGER)
- type (ENUM: purchase, usage, refund, admin_adjustment)
- description (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

**Trigger:** Auto-update wallet balance al insertar transacción

---

## 🔐 Sistema de Autenticación

### Flujo de Registro
1. Usuario completa formulario en `/auth/register`
2. `authService.signUp()` crea usuario en Supabase Auth
3. Trigger `handle_new_user()` crea perfil automáticamente
4. Trigger `handle_new_profile()` crea wallet con 100 créditos iniciales
5. Redirección a `/dashboard`

### Flujo de Login
1. Usuario completa formulario en `/auth/login`
2. `authService.signIn()` autentica con Supabase
3. `AuthGuard` verifica sesión
4. Redirección a `/dashboard`

### Protección de Rutas
```tsx
// Rutas protegidas
<AuthGuard>
  <ProtectedPage />
</AuthGuard>

// Verificación de admin
const isAdmin = await isAdmin();
if (!isAdmin) router.push("/dashboard");
```

---

## 💳 Sistema de Créditos

### Modelo de Créditos

**Wallet Balance:**
- Se actualiza automáticamente via trigger `update_wallet_balance`
- Transacciones son append-only (no se modifican)
- Balance = SUM(amount) de todas las transacciones

**Tipos de Transacciones:**
- `purchase`: Compra de créditos
- `usage`: Consumo por generación de código
- `refund`: Devolución
- `admin_adjustment`: Ajuste manual del admin

### Flujo de Consumo
```typescript
1. Verificar balance: getCreditWallet(userId)
2. Validar suficientes créditos
3. Ejecutar acción (generación de código)
4. Descontar créditos: deductCredits(userId, amount, description)
5. Trigger actualiza balance automáticamente
```

### Configuración de Costos
```sql
-- admin_settings table
{
  "generation_cost": {"cost": 10},
  "chat_cost": {"cost": 1},
  "deployment_cost": {"cost": 50}
}
```

---

## 🤖 Integración con IA

### Arquitectura de Generación

```
User Input (Chat)
  ↓
API Route (/api/ai/generate)
  ↓
1. Verificar créditos
2. Construir contexto (archivos actuales + mensajes previos)
3. Llamada a OpenAI GPT-4
  ↓
OpenAI Response (JSON)
  ↓
4. Parsear archivos generados
5. Guardar en project_files
6. Descontar créditos
7. Crear versión del proyecto
  ↓
Return a Frontend
```

### Prompt Engineering

**System Prompt:**
```
Eres un experto desarrollador que genera código limpio, modular y funcional.

Reglas:
- TypeScript estricto
- Tailwind CSS para estilos
- Componentes reutilizables
- Sin placeholders, código completo
- Retorna JSON: [{path, content, action}]
```

**User Context:**
```json
{
  "files": [
    {"path": "src/App.tsx", "content": "..."}
  ],
  "previousMessages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

---

## 🎨 Sistema de Diseño

### Tokens de Color

```css
:root {
  /* Cyber Premium Palette */
  --primary: 280 91% 65%;        /* Púrpura neón #A855F7 */
  --accent: 190 95% 43%;         /* Cyan eléctrico #06B6D4 */
  --background: 240 30% 4%;      /* Oscuro profundo #0A0A0F */
  --foreground: 0 0% 98%;        /* Blanco casi puro */
  
  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: 12px;
}
```

### Componentes Premium

**Glassmorphism Card:**
```tsx
<Card className="glass-panel border-border/50">
  {children}
</Card>
```

**Cyber Gradient Button:**
```tsx
<Button className="cyber-gradient">
  Acción
</Button>
```

**Neon Text:**
```tsx
<h1 className="neon-text-primary">
  Título Brillante
</h1>
```

---

## 📊 Builder Architecture

### Componentes del Builder

1. **ChatPanel**
   - Historial de mensajes
   - Input con submit
   - Estados de carga
   - Scroll automático

2. **PreviewPanel**
   - Iframe con sandbox
   - Modos: desktop/tablet/mobile
   - Refresh manual
   - Open in new tab

3. **FileExplorer**
   - Árbol de archivos
   - Búsqueda
   - Apertura de archivos
   - Iconos por tipo

4. **VersionHistory**
   - Lista cronológica
   - Restaurar versiones
   - Marcar versión actual
   - Descripción de cambios

### Flujo de Generación

```
1. Usuario escribe prompt en ChatPanel
2. Submit → addMessage(user, content)
3. API call: /api/ai/generate
4. Loading state: isProcessing = true
5. OpenAI genera código
6. Guardar archivos en DB
7. addMessage(assistant, response)
8. Actualizar FileExplorer
9. Crear nueva versión
10. PreviewPanel se actualiza
11. isProcessing = false
```

---

## 🚀 Deployment

### Vercel Setup

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
.next
```

**Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
VERCEL_TOKEN (opcional)
```

### Automatic Deployments

- **Production**: Push a `main` → Deploy automático
- **Preview**: Pull Requests → Preview deployment
- **Custom Domains**: Configurar en Vercel dashboard

---

## 🔧 Services Layer

### Patrón de Servicios

Todos los servicios siguen este patrón:

```typescript
// src/services/exampleService.ts

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export async function getResource(id: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from("table")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Error:", error);
    return null;
  }
  
  return data;
}
```

**Principios:**
- Siempre retornar `null` en error (nunca throw)
- Log errores en consola
- Tipos estrictos de Supabase
- Documentación clara

---

## 📈 Escalabilidad

### Horizontal Scaling

- **Database**: Supabase escala automáticamente
- **API Routes**: Serverless, escala con demanda
- **Frontend**: CDN de Vercel, edge caching

### Optimizaciones

1. **Database Indexes:**
```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_transactions_wallet_id ON credit_transactions(wallet_id);
```

2. **Caching:**
- React Query para cache de frontend
- Supabase Realtime para sincronización
- Edge caching en Vercel

3. **Code Splitting:**
```tsx
const AdminPanel = dynamic(() => import("@/pages/admin"), { ssr: false });
```

---

## 🧪 Testing Strategy

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
- Services: 80%+
- Components: 70%+
- API Routes: 90%+

---

## 📚 Documentación Adicional

- **API Reference**: Ver `/docs/api.md`
- **Component Library**: Ver Storybook
- **Database Schema**: Ver Supabase Dashboard

---

**Última actualización**: 2026-04-13  
**Versión**: 1.0.0
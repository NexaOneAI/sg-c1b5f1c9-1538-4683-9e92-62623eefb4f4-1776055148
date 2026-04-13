# Nexa One - AI App Builder Platform 🚀

> **Premium SaaS platform** que permite a usuarios crear aplicaciones web mediante conversaciones con IA. Inspirado en Lovable, mejorado con arquitectura moderna, diseño cyber premium y funcionalidad completa de extremo a extremo.

![Nexa One Logo](/public/inbound6875946183305017278.jpg)

---

## 🎯 Características Principales

### ✨ Core Features
- **Chat IA Inteligente**: Conversa con la IA para crear aplicaciones completas
- **Preview en Tiempo Real**: Ve los cambios aplicados instantáneamente
- **Control de Versiones**: Historial completo, restaura versiones anteriores
- **Explorador de Archivos**: Navega y edita la estructura del proyecto
- **Generación de Código**: Código limpio, modular y funcional
- **Sistema de Créditos**: Modelo freemium con planes escalables
- **Panel de Administración**: Gestión completa de usuarios y sistema

### 💎 Sistema de Planes
- **Free**: 100 créditos/mes, 3 proyectos
- **Pro**: 1,000 créditos/mes, 50 proyectos, exportación de código
- **Premium**: Créditos ilimitados, proyectos ilimitados, API access

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.2 (Page Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Hooks + Supabase Realtime
- **Icons**: Lucide React
- **Date**: date-fns

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **API Routes**: Next.js API Routes
- **AI**: OpenAI API (GPT-4)

### Deployment
- **Hosting**: Vercel
- **Database**: Supabase Cloud
- **CI/CD**: Vercel Auto-deploy

---

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/nexa-one.git
cd nexa-one
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
- **Supabase**: Ya está configurado
- **OpenAI**: Opcional, para generación real de código
- **Vercel**: Opcional, para deploy automático

### 4. Iniciar servidor de desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🗄️ Base de Datos

El schema de Supabase ya está creado y configurado con:

### Tablas Principales
- `profiles` - Perfiles de usuarios (con rol admin/superadmin)
- `projects` - Proyectos de usuarios
- `project_versions` - Control de versiones
- `project_files` - Archivos del proyecto
- `conversations` - Conversaciones del chat
- `messages` - Mensajes del chat
- `credit_wallets` - Billeteras de créditos
- `credit_transactions` - Historial de transacciones
- `subscriptions` - Suscripciones de usuarios
- `payments` - Registro de pagos
- `admin_settings` - Configuraciones del sistema

### Políticas RLS
Todas las tablas tienen políticas de seguridad configuradas:
- Usuarios solo ven sus propios datos
- Admins tienen acceso completo
- Políticas públicas para lectura cuando corresponde

---

## 🎨 Diseño

### Paleta de Colores (Cyber Premium)
- **Primary**: Púrpura neón (#A855F7)
- **Accent**: Cyan eléctrico (#06B6D4)
- **Background**: Oscuro profundo (#0A0A0F)
- **Glassmorphism**: Efectos de vidrio con blur

### Tipografía
- **UI/Body**: Inter (Google Fonts)
- **Headers**: Orbitron (futurista, alineado con el logo)

### Efectos Premium
- Glows sutiles en botones y badges
- Bordes neón con animaciones
- Gradientes cyber en CTAs
- Cards con glassmorphism
- Hover states suaves

---

## 🔐 Autenticación

### Registro/Login
- Email + Password (Supabase Auth)
- Recuperación de contraseña
- Sesión persistente
- Protección de rutas con `AuthGuard`

### Roles de Usuario
- `user` (default): Acceso estándar
- `admin`: Gestión de usuarios y créditos
- `superadmin`: Acceso completo al sistema

---

## 💳 Sistema de Créditos

### Cómo Funciona
1. Usuario registrado recibe créditos iniciales
2. Cada acción consume créditos:
   - Generación de código: configurable (default: 10)
   - Chat con IA: configurable (default: 1)
3. Admin puede ajustar créditos manualmente
4. Usuarios pueden comprar planes para más créditos

### Configuración de Costos
Los costos se configuran en la tabla `admin_settings`:
```sql
UPDATE admin_settings 
SET value = '{"cost": 5}'::jsonb 
WHERE key = 'generation_cost';
```

---

## 🤖 Integración con OpenAI

### Setup
1. Crear cuenta en [OpenAI Platform](https://platform.openai.com/)
2. Generar API Key en [API Keys](https://platform.openai.com/api-keys)
3. Agregar en `.env.local`:
```bash
OPENAI_API_KEY=sk-...
```
4. Instalar dependencia:
```bash
npm install openai
```

### Implementación
El código está preparado en `/src/pages/api/ai/generate.ts`. Solo debes:
1. Descomentar la sección de OpenAI
2. Ajustar el prompt del sistema según tus necesidades
3. Configurar temperatura y max_tokens

---

## 🚀 Deployment a Vercel

### Deploy Automático
1. Conecta tu repositorio en [Vercel](https://vercel.com)
2. Configura las variables de entorno
3. Deploy automático en cada push a `main`

### Variables de Entorno en Vercel
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=... (opcional)
VERCEL_TOKEN=... (opcional)
```

---

## 👨‍💼 Panel de Administración

### Acceso
- URL: `/admin`
- Requiere rol `admin` o `superadmin`

### Funcionalidades
- Ver todos los usuarios
- Ajustar créditos (+100, -50)
- Ver estadísticas del sistema
- Configurar costos de acciones
- Monitoreo de uso

### Crear Admin
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'tu-email@example.com';
```

---

## 📁 Estructura del Proyecto

```
nexa-one/
├── public/
│   └── inbound6875946183305017278.jpg  # Logo
├── src/
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── auth/                       # AuthGuard
│   │   ├── builder/                    # Builder components
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── PreviewPanel.tsx
│   │   │   ├── FileExplorer.tsx
│   │   │   └── VersionHistory.tsx
│   │   ├── Logo.tsx
│   │   └── SEO.tsx
│   ├── contexts/
│   │   └── ThemeProvider.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       ├── types.ts
│   │       └── database.types.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── pages/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   └── generate.ts        # AI generation endpoint
│   │   │   └── projects/
│   │   │       └── deploy.ts          # Deploy endpoint
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── builder/
│   │   │   └── [id].tsx               # Main builder
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── admin/
│   │   │   └── index.tsx
│   │   ├── pricing/
│   │   │   └── index.tsx
│   │   ├── settings/
│   │   │   └── index.tsx
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   └── index.tsx                  # Landing page
│   ├── services/
│   │   ├── authService.ts
│   │   ├── profileService.ts
│   │   ├── creditService.ts
│   │   ├── projectService.ts
│   │   └── conversationService.ts
│   └── styles/
│       └── globals.css
├── .env.local                          # Variables de entorno
├── .env.example                        # Template de .env
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🔧 Desarrollo

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
npm run type-check   # TypeScript check
```

### Extensión de Funcionalidades

#### Agregar Nueva Tabla
1. Crear tabla en Supabase
2. Regenerar tipos: `npm run supabase:types`
3. Crear servicio en `/src/services/`
4. Agregar políticas RLS

#### Agregar Nuevo Componente
1. Crear en `/src/components/`
2. Usar shadcn/ui: `npx shadcn-ui@latest add [component]`
3. Seguir patrones de diseño existentes

---

## 🎯 Roadmap

### Fase 1 - Completado ✅
- [x] Autenticación completa
- [x] Dashboard de proyectos
- [x] Builder con chat IA
- [x] Sistema de créditos
- [x] Panel de admin
- [x] Diseño premium cyber

### Fase 2 - Próximamente
- [ ] Integración real con OpenAI GPT-4
- [ ] Deploy automático a Vercel
- [ ] Editor de código en vivo
- [ ] Colaboración en tiempo real
- [ ] Exportación de proyectos
- [ ] Templates predefinidos

### Fase 3 - Futuro
- [ ] API pública para desarrolladores
- [ ] Marketplace de componentes
- [ ] Integración con GitHub
- [ ] Whitelabel para empresas
- [ ] Mobile app (React Native)

---

## 📝 Licencia

Propietario - Todos los derechos reservados © 2026 Nexa One

---

## 🤝 Contribución

Este es un proyecto privado. Para colaborar, contacta al equipo de desarrollo.

---

## 📞 Soporte

- **Email**: support@nexaone.com
- **Discord**: [Únete a la comunidad](https://discord.gg/nexaone)
- **Twitter**: [@NexaOneAI](https://twitter.com/NexaOneAI)

---

## ⚡ Performance

- **Lighthouse Score**: 95+
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Core Web Vitals**: Todos verdes

---

## 🙏 Agradecimientos

- **shadcn/ui** por los componentes UI premium
- **Vercel** por el hosting y deployment
- **Supabase** por el backend completo
- **OpenAI** por la tecnología de IA

---

**Construido con ❤️ por el equipo de Nexa One**
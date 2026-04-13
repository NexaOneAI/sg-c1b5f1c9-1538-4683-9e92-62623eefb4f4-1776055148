# 🚀 Guía de Deployment - Nexa One

Esta guía te ayudará a configurar completamente tu instancia de Nexa One con GitHub, Vercel y subdominios personalizados.

## 📋 Tabla de Contenidos

1. [Variables de Entorno](#variables-de-entorno)
2. [Configuración DNS Wildcard](#configuración-dns-wildcard)
3. [GitHub OAuth App](#github-oauth-app)
4. [Vercel Token](#vercel-token)
5. [Deployment Completo](#deployment-completo)

---

## 🔧 Variables de Entorno

Crea o actualiza tu archivo `.env.local` con estas variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tu-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[tu-service-role-key]

# OpenAI (para generación de código IA)
OPENAI_API_KEY=sk-proj-[tu-openai-key]

# Anthropic (opcional - para Claude)
ANTHROPIC_API_KEY=sk-ant-[tu-anthropic-key]

# GitHub OAuth
GITHUB_CLIENT_ID=[tu-client-id]
GITHUB_CLIENT_SECRET=[tu-client-secret]
GITHUB_REDIRECT_URI=https://nexaoneia.com/api/github/callback

# Vercel
VERCEL_TOKEN=[tu-vercel-token]
VERCEL_TEAM_ID=[tu-team-id] # Opcional, solo si usas Vercel Team

# Site URL
NEXT_PUBLIC_SITE_URL=https://nexaoneia.com

# Base Domain (para subdominios)
NEXT_PUBLIC_BASE_DOMAIN=nexaoneia.com
```

---

## 🌐 Configuración DNS Wildcard

Para que los subdominios funcionen (ej: `nexasaaspos.nexaoneia.com`), necesitas configurar un registro DNS wildcard.

### Paso 1: Acceder a tu Panel DNS (NSOne)

1. Ve a https://my.nsone.net/login
2. Inicia sesión
3. Selecciona tu zona: `nexaoneia.com`

### Paso 2: Agregar Registro Wildcard

**Opción A: Wildcard apuntando a Vercel**

```
Type: CNAME
Name: *
TTL: 300
Answer: cname.vercel-dns.com
```

**Opción B: Wildcard apuntando a IP fija**

```
Type: A
Name: *
TTL: 300
Answer: 76.76.21.21
```

### Paso 3: Verificar Configuración

**Desde Terminal:**
```bash
# Verificar que el wildcard funciona
dig random-test.nexaoneia.com

# Deberías ver:
# random-test.nexaoneia.com. 300 IN CNAME cname.vercel-dns.com.
```

**Desde Web:**
1. Ve a https://dnschecker.org
2. Escribe: `test.nexaoneia.com`
3. Type: `CNAME`
4. Deberías ver: `cname.vercel-dns.com`

### Paso 4: Configurar en Vercel

1. Ve a https://vercel.com/dashboard
2. Settings → Domains
3. Add Domain: `*.nexaoneia.com`
4. Vercel verificará automáticamente

**IMPORTANTE:** El wildcard permite que cualquier subdominio funcione:
- ✅ `nexasaaspos.nexaoneia.com`
- ✅ `miapp.nexaoneia.com`
- ✅ `cualquier-cosa.nexaoneia.com`

---

## 🔐 GitHub OAuth App

Para que los usuarios conecten sus repositorios, necesitas crear una GitHub OAuth App.

### Paso 1: Crear OAuth App

1. Ve a https://github.com/settings/developers
2. Click en **"OAuth Apps"**
3. Click en **"New OAuth App"**

### Paso 2: Configurar la App

**Application name:**
```
Nexa One
```

**Homepage URL:**
```
https://nexaoneia.com
```

**Application description:**
```
AI-powered web app builder with GitHub integration
```

**Authorization callback URL:**
```
https://nexaoneia.com/api/github/callback
```

### Paso 3: Obtener Credenciales

Después de crear la app:

1. **Client ID:** Copia el Client ID
2. **Client Secret:** Click en "Generate a new client secret" y cópialo

### Paso 4: Agregar a .env.local

```bash
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
GITHUB_REDIRECT_URI=https://nexaoneia.com/api/github/callback
```

### Paso 5: Probar Integración

1. Ve al Builder de un proyecto
2. Click en **"Conectar GitHub"**
3. Autoriza la app en GitHub
4. Deberías ver tus repositorios listados

---

## 🔑 Vercel Token

Para deployments automáticos, necesitas un token de Vercel.

### Paso 1: Crear Token

1. Ve a https://vercel.com/account/tokens
2. Click en **"Create Token"**
3. Nombre: `nexa-one-deployments`
4. Scope: **Full Access** (o solo deployment si prefieres)
5. Expiration: **No Expiration** (o 1 año)

### Paso 2: Copiar Token

```bash
VERCEL_TOKEN=ABC123xyz456DEF789ghi012JKL345
```

### Paso 3: Obtener Team ID (Opcional)

Si usas Vercel Teams:

1. Ve a https://vercel.com/teams/[tu-team]/settings
2. Copia el Team ID
3. Agrégalo a `.env.local`:

```bash
VERCEL_TEAM_ID=team_abc123xyz456
```

### Paso 4: Verificar Permisos

Tu token debe tener permisos para:
- ✅ Crear deployments
- ✅ Configurar dominios
- ✅ Leer/escribir proyectos

---

## 🚀 Deployment Completo

### Paso 1: Deploy Principal en Vercel

**Opción A: Desde Softgen (Recomendado)**

1. Click en **"Publish"** en Softgen
2. Selecciona **Vercel**
3. Autoriza con GitHub
4. Deploy automático

**Opción B: Desde Vercel Dashboard**

1. Ve a https://vercel.com/new
2. Importa tu repositorio
3. Framework: **Next.js**
4. Build Command: `npm run build`
5. Output Directory: `.next`
6. Install Command: `npm install`

### Paso 2: Configurar Variables de Entorno en Vercel

1. Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
2. Agrega TODAS las variables de `.env.local` (excepto las que empiezan con `NEXT_PUBLIC_`)
3. Environment: **Production, Preview, Development** (marca los 3)

**Variables a Agregar:**

```bash
SUPABASE_SERVICE_ROLE_KEY=[tu-service-role-key]
OPENAI_API_KEY=sk-proj-[...]
GITHUB_CLIENT_ID=[...]
GITHUB_CLIENT_SECRET=[...]
GITHUB_REDIRECT_URI=https://nexaoneia.com/api/github/callback
VERCEL_TOKEN=[...]
```

**Variables Públicas (agregar también):**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[...].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[...]
NEXT_PUBLIC_SITE_URL=https://nexaoneia.com
NEXT_PUBLIC_BASE_DOMAIN=nexaoneia.com
```

### Paso 3: Configurar Dominio Principal

1. Vercel → Settings → Domains
2. Add Domain: `nexaoneia.com`
3. Add Domain: `www.nexaoneia.com`
4. Vercel te dirá qué DNS configurar

### Paso 4: Configurar Wildcard Domain

1. Vercel → Settings → Domains
2. Add Domain: `*.nexaoneia.com`
3. Verifica que el DNS wildcard esté configurado (ver arriba)

### Paso 5: Redeploy

1. Vercel → Deployments
2. Click en **...** del último deployment
3. Click en **Redeploy**
4. Espera 2-3 minutos

---

## ✅ Verificación Final

### 1. Dominio Principal

```bash
# Debería responder
curl https://nexaoneia.com
```

### 2. Wildcard Subdominios

```bash
# Debería responder (aunque no exista el proyecto)
curl https://test.nexaoneia.com
```

### 3. GitHub OAuth

1. Ve al Builder
2. Click en "Conectar GitHub"
3. Deberías ser redirigido a GitHub
4. Autoriza y verifica que lista tus repos

### 4. Deploy de Proyecto

1. Crea un proyecto en Dashboard
2. Builder → Click en "Deploy"
3. Subdominio: `miapp`
4. Click en "Desplegar"
5. Espera 2-3 minutos
6. Visita: `https://miapp.nexaoneia.com`

---

## 🐛 Troubleshooting

### Error: "GitHub OAuth redirect mismatch"

**Solución:**
1. Ve a tu GitHub OAuth App
2. Verifica que el callback URL sea exactamente: `https://nexaoneia.com/api/github/callback`
3. Sin trailing slash `/`

### Error: "Vercel deployment failed"

**Solución:**
1. Verifica que `VERCEL_TOKEN` sea válido
2. Verifica que el token tenga permisos de deployment
3. Revisa los logs en Vercel Dashboard

### Error: "Subdomain not working"

**Solución:**
1. Verifica que el wildcard DNS esté configurado: `dig *.nexaoneia.com`
2. Espera 5-15 minutos para propagación DNS
3. Verifica en Vercel que `*.nexaoneia.com` esté agregado

### Error: "SSL certificate not issued"

**Solución:**
1. Vercel genera SSL automáticamente (puede tardar 1 hora)
2. Verifica que el dominio apunte correctamente a Vercel
3. No requiere acción, es automático

---

## 📊 Flujo Completo de Deployment

```
Usuario crea proyecto "Nexa SaaS POS"
        ↓
Genera subdominio: "nexasaaspos"
        ↓
Usuario click en "Deploy"
        ↓
API llama a Vercel con token
        ↓
Vercel crea deployment en nexasaaspos.nexaoneia.com
        ↓
DNS wildcard resuelve *.nexaoneia.com → Vercel
        ↓
Vercel genera SSL automático
        ↓
App disponible en https://nexasaaspos.nexaoneia.com
```

---

## 🎯 Estado Ideal

Cuando todo está configurado:

```
✅ nexaoneia.com → App principal funcionando
✅ www.nexaoneia.com → Redirect a nexaoneia.com
✅ *.nexaoneia.com → Wildcard funcionando
✅ GitHub OAuth → Conectando repositorios
✅ Vercel Deployments → Creando subdominios
✅ SSL → Activo en todos los dominios
```

---

## 📞 Soporte

**Si tienes problemas:**

1. Verifica todas las variables de entorno
2. Revisa los logs de Vercel
3. Verifica DNS con `dig` o https://dnschecker.org
4. Contacta al equipo de Nexa One

**Recursos:**

- Vercel Docs: https://vercel.com/docs
- GitHub OAuth: https://docs.github.com/en/apps/oauth-apps
- NSOne Docs: https://ns1.com/resources/dns-records-explained

---

¡Listo! Ahora tu instancia de Nexa One está completamente configurada con GitHub, Vercel y subdominios personalizados. 🚀
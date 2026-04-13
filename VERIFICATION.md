# ✅ Verificación de Configuración - Nexa One

Esta guía te ayuda a verificar que toda la configuración esté correcta antes de usar Nexa One en producción.

## 📋 Checklist de Verificación

### 1. Base de Datos (Supabase)

**Tablas Requeridas:**

```sql
-- Verificar que todas las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Debería mostrar:**
- ✅ `admin_settings`
- ✅ `conversations`
- ✅ `conversation_messages`
- ✅ `credit_transactions`
- ✅ `credit_wallets`
- ✅ `deployment_logs`
- ✅ `github_connections`
- ✅ `profiles`
- ✅ `projects`
- ✅ `project_files`
- ✅ `project_versions`
- ✅ `subscriptions`

**Políticas RLS:**

```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

**Todas las tablas deben tener `rowsecurity = true`**

---

### 2. Autenticación

**Verificar Trigger de Auto-Setup:**

```sql
-- Verificar que el trigger existe
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Debería mostrar:**
- ✅ `on_auth_user_created` en tabla `users`

**Probar Registro:**

1. Abre incógnito en tu navegador
2. Ve a `/auth/register`
3. Regístrate con un email de prueba
4. Verifica que se crea automáticamente:
   - ✅ Perfil en `profiles`
   - ✅ Wallet en `credit_wallets` con 100 créditos
   - ✅ Suscripción Free en `subscriptions`

**SQL para verificar:**

```sql
SELECT 
  p.email,
  p.full_name,
  w.balance as credits,
  s.plan_tier,
  s.status
FROM profiles p
LEFT JOIN credit_wallets w ON w.user_id = p.id
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.email = 'tu-email-de-prueba@example.com';
```

---

### 3. Créditos y Transacciones

**Verificar Wallet:**

```sql
-- Ver todos los wallets
SELECT 
  w.user_id,
  p.email,
  w.balance,
  w.created_at
FROM credit_wallets w
JOIN profiles p ON p.id = w.user_id
ORDER BY w.created_at DESC;
```

**Verificar Transacciones:**

```sql
-- Ver transacciones recientes
SELECT 
  ct.amount,
  ct.type,
  ct.description,
  ct.created_at,
  p.email
FROM credit_transactions ct
JOIN credit_wallets cw ON cw.id = ct.wallet_id
JOIN profiles p ON p.id = cw.user_id
ORDER BY ct.created_at DESC
LIMIT 10;
```

**Probar Descuento de Créditos:**

1. Crea un proyecto
2. Abre el Builder
3. Envía un mensaje al chat IA
4. Verifica que:
   - ✅ Se descuentan 10 créditos
   - ✅ Aparece transacción en `credit_transactions`
   - ✅ Balance se actualiza en tiempo real

---

### 4. GitHub Integration

**Verificar Tablas:**

```sql
-- Ver conexiones de GitHub
SELECT 
  gc.github_username,
  gc.access_token IS NOT NULL as has_token,
  p.email,
  gc.created_at
FROM github_connections gc
JOIN profiles p ON p.id = gc.user_id;
```

**Probar OAuth Flow:**

1. Ve al Builder de un proyecto
2. Click en "Conectar GitHub"
3. Autoriza en GitHub
4. Verifica que:
   - ✅ Te redirige de vuelta al Builder
   - ✅ Ves tus repositorios listados
   - ✅ Aparece registro en `github_connections`

**Verificar Variables de Entorno:**

```bash
# En terminal o código
echo $GITHUB_CLIENT_ID
echo $GITHUB_CLIENT_SECRET
echo $GITHUB_REDIRECT_URI
```

**Deben estar configuradas y ser correctas**

---

### 5. Deployments y Subdominios

**Verificar Configuración DNS:**

```bash
# Verificar dominio principal
dig nexaoneia.com A

# Verificar wildcard
dig test.nexaoneia.com CNAME
dig random.nexaoneia.com CNAME

# Deberían apuntar a Vercel
```

**Verificar Deployment Logs:**

```sql
-- Ver deployments recientes
SELECT 
  dl.project_id,
  p.name as project_name,
  dl.subdomain,
  dl.deployment_url,
  dl.status,
  dl.created_at
FROM deployment_logs dl
JOIN projects p ON p.id = dl.project_id
ORDER BY dl.created_at DESC;
```

**Probar Deploy:**

1. Crea un proyecto
2. Builder → Click "Deploy"
3. Subdominio: `test-deployment`
4. Click "Desplegar"
5. Verifica que:
   - ✅ Se crea deployment en Vercel
   - ✅ Aparece log en `deployment_logs`
   - ✅ URL funciona: `https://test-deployment.nexaoneia.com`

**Verificar Variables de Entorno:**

```bash
echo $VERCEL_TOKEN
echo $NEXT_PUBLIC_BASE_DOMAIN
```

---

### 6. OpenAI Integration

**Verificar API Key:**

```bash
# Verificar que la key existe
echo $OPENAI_API_KEY | head -c 20

# Debería empezar con: sk-proj-...
```

**Probar Generación de Código:**

1. Ve al Builder
2. Escribe: "Crea un botón con gradiente"
3. Verifica que:
   - ✅ IA responde en 5-10 segundos
   - ✅ Se genera código
   - ✅ Se crean archivos en `project_files`
   - ✅ Se descuentan créditos

**Verificar Costos Configurados:**

```sql
-- Ver configuración de costos de IA
SELECT * FROM admin_settings WHERE key = 'ai_model_costs';
```

**Debería mostrar:**

```json
{
  "gpt4": { "cost": 10 },
  "claude_sonnet": { "cost": 20 },
  "claude_opus": { "cost": 40 }
}
```

---

### 7. Proyectos y Archivos

**Verificar Creación de Proyecto:**

```sql
-- Ver proyectos recientes
SELECT 
  p.id,
  p.name,
  p.owner_id,
  pr.email as owner_email,
  p.status,
  p.created_at
FROM projects p
JOIN profiles pr ON pr.id = p.owner_id
ORDER BY p.created_at DESC
LIMIT 5;
```

**Verificar Archivos:**

```sql
-- Ver archivos de un proyecto
SELECT 
  pf.file_name,
  pf.file_path,
  pf.file_type,
  LENGTH(pf.content) as content_size,
  pf.created_at
FROM project_files pf
WHERE pf.project_id = 'tu-project-id'
ORDER BY pf.created_at DESC;
```

**Verificar Versiones:**

```sql
-- Ver versiones de un proyecto
SELECT 
  pv.version_number,
  pv.name,
  pv.is_current,
  pv.created_at
FROM project_versions pv
WHERE pv.project_id = 'tu-project-id'
ORDER BY pv.created_at DESC;
```

---

### 8. Panel de Administración

**Verificar Rol de Superadmin:**

```sql
-- Ver admins
SELECT email, role, created_at
FROM profiles
WHERE role IN ('admin', 'superadmin')
ORDER BY created_at DESC;
```

**Probar Panel Admin:**

1. Inicia sesión con cuenta superadmin
2. Ve a `/admin`
3. Verifica que:
   - ✅ Ves todos los usuarios
   - ✅ Puedes ajustar créditos
   - ✅ Ves estadísticas del sistema
   - ✅ Puedes buscar usuarios

**Verificar Permisos:**

```sql
-- Verificar políticas RLS para admin
SELECT * FROM pg_policies 
WHERE tablename = 'credit_wallets' 
AND policyname LIKE '%admin%';
```

---

### 9. Variables de Entorno Completas

**Checklist de Variables:**

```bash
# Supabase
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY

# OpenAI
✅ OPENAI_API_KEY

# GitHub
✅ GITHUB_CLIENT_ID
✅ GITHUB_CLIENT_SECRET
✅ GITHUB_REDIRECT_URI

# Vercel
✅ VERCEL_TOKEN

# Site
✅ NEXT_PUBLIC_SITE_URL
✅ NEXT_PUBLIC_BASE_DOMAIN
```

**Verificar desde Código:**

```typescript
// En cualquier archivo .tsx
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Site URL:", process.env.NEXT_PUBLIC_SITE_URL);
console.log("Base Domain:", process.env.NEXT_PUBLIC_BASE_DOMAIN);
```

---

### 10. SSL y HTTPS

**Verificar Certificados:**

```bash
# Dominio principal
openssl s_client -connect nexaoneia.com:443 -servername nexaoneia.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Subdominio wildcard
openssl s_client -connect test.nexaoneia.com:443 -servername test.nexaoneia.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

**Debería mostrar:**
- ✅ Certificado válido
- ✅ Issuer: Let's Encrypt
- ✅ Válido hasta fecha futura

**Verificar desde Browser:**

1. Ve a https://nexaoneia.com
2. Click en el candado (🔒)
3. Verifica:
   - ✅ Certificado válido
   - ✅ HTTPS activo
   - ✅ No hay errores de seguridad

---

### 11. Performance y Logs

**Verificar Logs de Servidor:**

```bash
# En Vercel
# Dashboard → Tu Proyecto → Logs (en tiempo real)

# Busca:
✅ No hay errores 500
✅ No hay errores de CORS
✅ No hay errores de autenticación
✅ Respuestas < 1 segundo
```

**Verificar Performance:**

```bash
# Lighthouse Score (desde Chrome DevTools)
# Objetivo:
✅ Performance: > 80
✅ Accessibility: > 90
✅ Best Practices: > 90
✅ SEO: > 90
```

---

## 🚨 Problemas Comunes

### Error: "No se pudo verificar tu saldo de créditos"

**Verificar:**

```sql
-- Usuario tiene wallet?
SELECT w.* 
FROM credit_wallets w
JOIN profiles p ON p.id = w.user_id
WHERE p.email = 'tu-email@example.com';
```

**Solución:**

```sql
-- Crear wallet manualmente si falta
INSERT INTO credit_wallets (user_id, balance)
VALUES ('tu-user-id', 100);
```

---

### Error: "GitHub OAuth redirect mismatch"

**Verificar:**
1. GitHub OAuth App → Settings
2. Callback URL debe ser EXACTAMENTE: `https://nexaoneia.com/api/github/callback`
3. Sin trailing slash

---

### Error: "Subdominio no funciona"

**Verificar DNS:**

```bash
dig *.nexaoneia.com CNAME
```

**Debería mostrar:**
```
*.nexaoneia.com. 300 IN CNAME cname.vercel-dns.com.
```

**Si no aparece:**
1. Ve a NSOne
2. Agrega registro CNAME wildcard
3. Espera 10-15 minutos

---

### Error: "OpenAI API error"

**Verificar:**

```bash
# API key válida?
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Debería retornar lista de modelos**

**Si falla:**
1. Verifica que la key empiece con `sk-proj-`
2. Verifica que no esté expirada
3. Verifica que tengas créditos en OpenAI

---

## ✅ Checklist Final

Antes de ir a producción, verifica:

```
✅ Base de datos: Todas las tablas creadas
✅ RLS: Todas las políticas configuradas
✅ Trigger: Auto-setup de usuarios funcionando
✅ Créditos: Se otorgan 100 al registrarse
✅ GitHub: OAuth funcionando
✅ Deploy: Subdominios funcionando
✅ DNS: Wildcard configurado
✅ SSL: Certificados activos
✅ IA: Generación de código funcionando
✅ Variables: Todas configuradas
✅ Admin: Panel de superadmin accesible
✅ Performance: Lighthouse > 80
✅ Logs: Sin errores críticos
```

---

## 📊 Estado Esperado

**Usuarios:**
- Registro en < 5 segundos
- 100 créditos gratis al registrarse
- Plan Free activo automáticamente

**Proyectos:**
- Creación instantánea
- Chat IA responde en 5-10 segundos
- Files se crean y se ven en explorer

**GitHub:**
- OAuth en 1 click
- Lista repos en < 2 segundos
- Push exitoso con confirmación

**Deployments:**
- Deploy completo en 2-3 minutos
- Subdominio activo con SSL
- URL funcional inmediatamente

---

## 🎯 Métricas de Éxito

**Performance:**
- Tiempo de carga inicial: < 2 segundos
- Generación IA: 5-10 segundos
- Deploy: 2-3 minutos
- Push GitHub: < 30 segundos

**Uptime:**
- Objetivo: 99.9% (usando Vercel)
- Monitoreo: Vercel Analytics

**Usuarios:**
- Registro exitoso: > 95%
- IA funcional: > 98%
- Deployments exitosos: > 90%

---

¡Verificación completada! Si todos los checks pasan, tu instancia de Nexa One está lista para producción. 🚀
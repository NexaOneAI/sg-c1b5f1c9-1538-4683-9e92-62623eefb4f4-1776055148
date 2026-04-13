# 🚀 Deploy de Nexa One a Vercel con Dominio Personalizado

## Tu Dominio: nexaoneia.com

---

## 📋 PASO 1: Configurar DNS de tu Dominio

Ve al panel de tu registrador de dominios (donde compraste nexaoneia.com: GoDaddy, Namecheap, Cloudflare, etc.)

### Registros DNS a agregar:

```
Tipo: A
Nombre: @ (o déjalo vacío)
Valor: 76.76.21.21
TTL: Automático (o 3600)

Tipo: CNAME
Nombre: www
Valor: cname.vercel-dns.com
TTL: Automático (o 3600)
```

**IMPORTANTE:** Elimina TODOS los registros anteriores de Netlify (A, CNAME, ALIAS) antes de agregar estos.

**Tiempo de propagación:** 5-30 minutos (puede ser hasta 48h)

---

## 🔧 PASO 2: Deploy a Vercel

### 2.1 - Subir código a GitHub
```bash
git add .
git commit -m "Ready for production deploy"
git push origin main
```

### 2.2 - Conectar a Vercel
1. Ir a https://vercel.com/new
2. Click "Import Git Repository"
3. Seleccionar tu repositorio de Nexa One
4. Click "Import"

### 2.3 - Configurar Variables de Entorno
En Vercel Dashboard → Settings → Environment Variables, agregar:

```
NEXT_PUBLIC_SUPABASE_URL=https://deazvergpfgiqmjklupz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYXp2ZXJncGZnaXFtamtsdXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MTg4NTcsImV4cCI6MjA2MDE5NDg1N30.KNh8lPQtA8AXfzLjdqGvTJbPaP8Nx7m2HoXRPQ7V9js

OPENAI_API_KEY=tu_openai_api_key_aqui
ANTHROPIC_API_KEY=tu_anthropic_api_key_aqui

NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-6a564eae-b14f-4601-bcc8-5cf913c8f5e7
MERCADOPAGO_ACCESS_TOKEN=APP_USR-5176517905303899-040605-6b10e7d7475811d83b273bd6a6a648da-3143102298

NEXT_PUBLIC_APP_URL=https://nexaoneia.com
NEXT_PUBLIC_APP_NAME=Nexa One
```

**IMPORTANTE:** Copia las API Keys reales de OpenAI y Anthropic desde tus dashboards.

### 2.4 - Deploy
1. Click "Deploy"
2. Esperar 2-3 minutos
3. ✅ Tu app estará en `tu-proyecto.vercel.app`

---

## 🌐 PASO 3: Conectar Dominio Personalizado

### 3.1 - En Vercel
1. Ir a tu proyecto en Vercel
2. Settings → Domains
3. Click "Add Domain"
4. Escribir: `nexaoneia.com`
5. Click "Add"
6. Vercel verificará los DNS (puede tardar unos minutos)

### 3.2 - Agregar www (opcional pero recomendado)
1. Settings → Domains
2. Click "Add Domain"
3. Escribir: `www.nexaoneia.com`
4. Click "Add"
5. Marcar como "Redirect to nexaoneia.com"

---

## 🔐 PASO 4: Configurar Supabase Auth

### 4.1 - Actualizar Redirect URLs
1. Ir a https://supabase.com/dashboard/project/deazvergpfgiqmjklupz/auth/url-configuration
2. En "Site URL" cambiar a: `https://nexaoneia.com`
3. En "Redirect URLs" agregar:
   ```
   https://nexaoneia.com/**
   https://nexaoneia.com/auth/callback
   https://www.nexaoneia.com/**
   ```
4. Guardar cambios

### 4.2 - Configurar Email Templates (opcional)
1. Authentication → Email Templates
2. Actualizar URLs en los templates de:
   - Confirmation
   - Recovery
   - Magic Link
   
   Reemplazar cualquier URL temporal por: `https://nexaoneia.com`

---

## 💳 PASO 5: Configurar Webhook de Mercado Pago

### Solo cuando actives pagos automáticos:
1. Ir a https://www.mercadopago.com.ar/developers/panel/notifications/webhooks
2. Click "Crear webhook"
3. URL: `https://nexaoneia.com/api/payments/webhook`
4. Eventos: Seleccionar "Pagos"
5. Guardar

---

## ✅ VERIFICACIÓN FINAL

### Checklist de deploy exitoso:
- [ ] DNS configurados (A y CNAME)
- [ ] Proyecto deployado en Vercel
- [ ] Dominio conectado (nexaoneia.com)
- [ ] SSL/HTTPS activo (Vercel lo hace automático)
- [ ] Variables de entorno configuradas
- [ ] Supabase redirect URLs actualizadas
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Chat IA funciona
- [ ] Preview funciona

### URLs finales:
- **Producción:** https://nexaoneia.com
- **Dashboard Vercel:** https://vercel.com/dashboard
- **Dashboard Supabase:** https://supabase.com/dashboard/project/deazvergpfgiqmjklupz

---

## 🐛 Troubleshooting

### "Error: Invalid redirect URL"
→ Revisar que las redirect URLs en Supabase incluyan `https://nexaoneia.com/**`

### "DNS no se resuelve"
→ Esperar más tiempo (hasta 48h) o verificar que los registros DNS estén correctos

### "Error 500 en API Routes"
→ Verificar que TODAS las variables de entorno estén configuradas en Vercel

### "Pagos no funcionan"
→ Verificar que las credenciales de Mercado Pago sean de PRODUCCIÓN y estén correctas

---

## 📞 Soporte

Si tienes problemas:
1. Verificar logs en Vercel Dashboard → tu proyecto → Deployments → Click en deployment → Logs
2. Verificar logs en Supabase Dashboard → Logs
3. Abrir consola del navegador (F12) y buscar errores

---

## 🎉 ¡Listo!

Tu plataforma Nexa One estará live en:
**https://nexaoneia.com**

Deploy time total: ~10-15 minutos + propagación DNS
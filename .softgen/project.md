# Nexa One - AI App Builder Platform

## Vision
Plataforma SaaS premium tipo Lovable donde usuarios crean aplicaciones web mediante conversaciones con IA. Sistema completo de extremo a extremo con autenticación, proyectos, versiones, créditos, planes y panel de administración.

## Design
**Paleta Cyber Premium:**
- `--primary: 280 91% 65%` (Púrpura neón - #A855F7)
- `--accent: 190 95% 43%` (Cyan eléctrico - #06B6D4)
- `--background: 240 30% 4%` (Oscuro profundo - #0A0A0F)
- `--foreground: 0 0% 98%` (Blanco casi puro)

**Tipografía:**
- Headings: Orbitron (futurista, cyber)
- Body: Inter (limpio, técnico)

**Efectos Premium:**
- Glassmorphism en cards
- Glows neón sutiles
- Gradientes animados en CTAs
- Bordes luminosos
- Espaciado generoso estilo Linear

## Features

### Core Features
1. **Autenticación Completa**
   - Login/Registro con Supabase Auth
   - Recuperación de contraseña
   - Sesión persistente
   - Roles: user, admin, superadmin

2. **Dashboard Principal**
   - Listado de proyectos del usuario
   - Crear nuevo proyecto
   - Tarjetas con preview
   - Buscador
   - Indicadores de créditos y plan

3. **Builder Tipo Lovable**
   - Chat IA conversacional
   - Preview en tiempo real
   - Explorador de archivos
   - Control de versiones
   - Historial de cambios
   - Restaurar versiones anteriores

4. **Sistema de Proyectos**
   - CRUD completo
   - Versionado automático
   - Archivos del proyecto
   - Metadata y configuración
   - Estados: active, archived, deleted

5. **Sistema de Créditos**
   - Wallet por usuario
   - Transacciones registradas
   - Descuento automático por uso
   - Admin puede ajustar manualmente
   - Planes: Free (100), Pro (1000), Premium (ilimitado)

6. **Panel de Administración**
   - Gestión de usuarios
   - Ajuste de créditos
   - Ver todos los proyectos
   - Configurar costos por acción
   - Estadísticas del sistema

7. **Sistema de Planes**
   - Free: 100 créditos/mes, 3 proyectos
   - Pro: 1000 créditos/mes, 50 proyectos
   - Premium: Ilimitado

8. **Integraciones Preparadas**
   - OpenAI API (endpoint `/api/ai/generate`)
   - Vercel Deploy (endpoint `/api/projects/deploy`)
   - Estructura lista para pagos (Stripe/Mercado Pago)
</file_path>
# 🔔 Guía de Configuración de Monitoreo y Alertas - ThePlayer.gg

## 📋 Índice
1. [Configuración de Alertas en Supabase](#configuración-de-alertas-en-supabase)
2. [Monitoreo de Logs](#monitoreo-de-logs)
3. [Métricas Clave a Vigilar](#métricas-clave-a-vigilar)
4. [Plan de Respuesta a Incidentes](#plan-de-respuesta-a-incidentes)
5. [Checklist de Revisión Semanal](#checklist-de-revisión-semanal)

---

## 🔔 Configuración de Alertas en Supabase

### Paso 1: Acceder al Panel de Alertas

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto **ThePlayer.gg**
3. En el menú lateral, haz clic en **Reports** (icono de gráfico 📊)
4. Haz clic en la pestaña **"Custom Reports"** o **"Alerts"**

### Paso 2: Configurar Alertas Críticas

#### Alerta 1: Errores 500 (Errores del Servidor)

**¿Por qué es importante?** Los errores 500 indican problemas en tu backend o base de datos.

**Configuración:**
```
Nombre: Errores 500 Frecuentes
Métrica: HTTP Status Code 500
Condición: Más de 10 errores en 5 minutos
Acción: Enviar email a tu correo
```

**Cómo configurar:**
1. Haz clic en **"Create Alert"** o **"New Alert"**
2. Selecciona **"API Logs"** como fuente
3. Filtra por `status_code = 500`
4. Establece umbral: `count > 10` en `5 minutes`
5. Agrega tu email de notificación
6. Guarda

#### Alerta 2: Picos de Tráfico Inusuales

**¿Por qué es importante?** Puede indicar un ataque DDoS o tráfico malicioso.

**Configuración:**
```
Nombre: Pico de Tráfico Sospechoso
Métrica: Requests por minuto
Condición: Más de 1000 requests en 1 minuto
Acción: Enviar email
```

**Cómo configurar:**
1. Create Alert → **"API Logs"**
2. Métrica: `Total Requests`
3. Umbral: `count > 1000` en `1 minute`
4. Notificación por email
5. Guarda

#### Alerta 3: Intentos de Login Fallidos

**¿Por qué es importante?** Puede indicar un ataque de fuerza bruta.

**Configuración:**
```
Nombre: Intentos de Login Fallidos
Métrica: Auth errors
Condición: Más de 50 fallos en 10 minutos
Acción: Enviar email
```

**Cómo configurar:**
1. Create Alert → **"Auth Logs"**
2. Filtra por `event_type = 'user_signedup_failed'` o `'user_signin_failed'`
3. Umbral: `count > 50` en `10 minutes`
4. Notificación por email
5. Guarda

#### Alerta 4: Uso Excesivo de Base de Datos

**¿Por qué es importante?** Puede indicar queries ineficientes o un ataque.

**Configuración:**
```
Nombre: Alto Uso de DB
Métrica: Database CPU
Condición: Más de 80% durante 5 minutos
Acción: Enviar email
```

**Cómo configurar:**
1. Ve a **Settings** → **Database**
2. Habilita **"Database Metrics"**
3. Configura alerta para CPU > 80%
4. Guarda

---

## 📊 Monitoreo de Logs

### Acceso a Logs en Tiempo Real

1. Ve a **Supabase Dashboard** → **Logs**
2. Verás 4 tipos de logs:
   - **API Logs** - Requests HTTP
   - **Auth Logs** - Autenticación
   - **Database Logs** - Queries SQL
   - **Storage Logs** - Archivos subidos

### Logs Críticos a Revisar Semanalmente

#### 1. API Logs
```sql
-- Buscar errores 4xx y 5xx
SELECT 
    timestamp,
    status_code,
    method,
    path,
    error_message
FROM api_logs
WHERE status_code >= 400
ORDER BY timestamp DESC
LIMIT 100;
```

**Qué buscar:**
- ✅ **200-299**: OK
- ⚠️ **400-499**: Errores del cliente (puede ser normal)
- ❌ **500-599**: Errores del servidor (CRÍTICO, investigar)

#### 2. Auth Logs
```sql
-- Buscar intentos de login fallidos
SELECT 
    timestamp,
    event_type,
    user_id,
    ip_address
FROM auth_logs
WHERE event_type LIKE '%failed%'
ORDER BY timestamp DESC
LIMIT 50;
```

**Qué buscar:**
- Múltiples fallos desde la misma IP → Posible ataque
- Fallos en usuarios específicos → Posible cuenta comprometida

#### 3. Database Logs
```sql
-- Buscar queries lentas
SELECT 
    timestamp,
    query,
    execution_time_ms
FROM database_logs
WHERE execution_time_ms > 1000  -- Más de 1 segundo
ORDER BY execution_time_ms DESC
LIMIT 20;
```

**Qué buscar:**
- Queries que toman >1 segundo → Optimizar
- Queries repetitivas → Agregar índices o cache

---

## 🎯 Métricas Clave a Vigilar

### Métricas de Seguridad

| Métrica | Valor Normal | Valor Alarmante | Acción |
|---------|--------------|-----------------|--------|
| Errores 500 | < 5/hora | > 20/hora | Revisar logs inmediatamente |
| Login fallidos | < 10/hora | > 100/hora | Posible ataque de fuerza bruta |
| Requests/min | 10-100 | > 1000 | Posible DDoS |
| RLS violations | 0 | > 5 | Revisar políticas RLS |

### Métricas de Rendimiento

| Métrica | Valor Normal | Valor Alarmante | Acción |
|---------|--------------|-----------------|--------|
| Response time | < 500ms | > 2000ms | Optimizar queries |
| DB CPU | < 50% | > 80% | Escalar o optimizar |
| Conexiones DB | < 20 | > 50 | Revisar connection pooling |

---

## 🚨 Plan de Respuesta a Incidentes

### Nivel 1: Advertencia (⚠️)
**Ejemplos:** Pico de tráfico moderado, algunos errores 500

**Acciones:**
1. Revisar logs en Supabase Dashboard
2. Identificar la causa (query lenta, endpoint específico)
3. Documentar en un archivo de incidentes
4. Monitorear durante 1 hora

### Nivel 2: Crítico (❌)
**Ejemplos:** Múltiples errores 500, ataque de fuerza bruta, sitio caído

**Acciones:**
1. **Inmediato (0-5 min):**
   - Revisar Supabase Dashboard → Logs
   - Identificar el problema (tabla, endpoint, usuario)
   
2. **Mitigación (5-15 min):**
   - Si es un ataque: Bloquear IPs en Vercel/Cloudflare
   - Si es un bug: Revertir último deploy
   - Si es DB: Pausar queries problemáticas
   
3. **Resolución (15-60 min):**
   - Arreglar el problema raíz
   - Desplegar fix
   - Verificar que el problema se resolvió
   
4. **Post-Mortem (24h después):**
   - Documentar qué pasó
   - Qué se hizo bien
   - Qué se puede mejorar
   - Implementar prevenciones

### Nivel 3: Emergencia (🔥)
**Ejemplos:** Brecha de seguridad, datos expuestos, sitio completamente caído

**Acciones:**
1. **Inmediato:**
   - Pausar el proyecto en Supabase (si es necesario)
   - Cambiar todas las claves API
   - Notificar a usuarios afectados
   
2. **Investigación:**
   - Revisar todos los logs
   - Identificar alcance del daño
   - Documentar evidencia
   
3. **Remediación:**
   - Parchear vulnerabilidad
   - Restaurar desde backup si es necesario
   - Forzar reset de contraseñas de usuarios
   
4. **Comunicación:**
   - Publicar post-mortem público
   - Notificar a autoridades si aplica (GDPR, etc.)

---

## ✅ Checklist de Revisión Semanal

### Lunes (15 minutos)
- [ ] Revisar alertas de la semana pasada
- [ ] Verificar que no haya errores 500 persistentes
- [ ] Revisar métricas de rendimiento (response time, DB CPU)

### Miércoles (10 minutos)
- [ ] Revisar logs de autenticación
- [ ] Buscar patrones sospechosos (IPs repetidas, fallos masivos)
- [ ] Verificar que RLS policies estén funcionando

### Viernes (20 minutos)
- [ ] Ejecutar script de auditoría RLS (`SECURITY_AUDIT_SIMPLE.sql`)
- [ ] Revisar dependencias: `npm audit`
- [ ] Verificar backups de Supabase
- [ ] Documentar cualquier incidente de la semana

---

## 📈 Dashboard de Métricas Recomendado

### Crear Dashboard Personalizado en Supabase

1. Ve a **Reports** → **Custom Reports**
2. Crea un nuevo dashboard llamado **"Security & Performance"**
3. Agrega los siguientes widgets:

#### Widget 1: Errores por Hora
```sql
SELECT 
    date_trunc('hour', timestamp) as hour,
    COUNT(*) as error_count
FROM api_logs
WHERE status_code >= 500
AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

#### Widget 2: Top Endpoints Lentos
```sql
SELECT 
    path,
    AVG(response_time_ms) as avg_response_time,
    COUNT(*) as request_count
FROM api_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY path
ORDER BY avg_response_time DESC
LIMIT 10;
```

#### Widget 3: Intentos de Login Fallidos por IP
```sql
SELECT 
    ip_address,
    COUNT(*) as failed_attempts
FROM auth_logs
WHERE event_type LIKE '%failed%'
AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY failed_attempts DESC
LIMIT 10;
```

---

## 🔧 Herramientas Adicionales Recomendadas

### 1. Sentry (Error Tracking)
**Costo:** Gratis hasta 5,000 eventos/mes

**Instalación:**
```bash
npm install @sentry/react
```

**Configuración básica:**
```tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "TU_SENTRY_DSN",
  environment: import.meta.env.VITE_APP_ENV,
  tracesSampleRate: 0.1, // 10% de transacciones
});
```

**Beneficios:**
- Captura errores de JavaScript en producción
- Stack traces detallados
- Alertas por email
- Integración con Slack/Discord

### 2. Uptime Robot (Monitoreo de Disponibilidad)
**Costo:** Gratis hasta 50 monitores

**Configuración:**
1. Ve a https://uptimerobot.com
2. Crea un monitor para `https://theplayer.gg`
3. Configura alertas por email si el sitio cae
4. Frecuencia: Cada 5 minutos

### 3. Google Analytics (Opcional)
Para monitorear tráfico y comportamiento de usuarios.

---

## 📞 Contactos de Emergencia

**Documenta aquí:**
- Email del administrador: _______________
- Email de soporte de Supabase: support@supabase.io
- Email de soporte de Vercel: support@vercel.com

---

## 📝 Registro de Incidentes

Mantén un log de incidentes en `docs/INCIDENT_LOG.md`:

```markdown
# Registro de Incidentes

## 2026-01-06 - Pico de Errores 500
- **Severidad:** Nivel 2 (Crítico)
- **Duración:** 15 minutos
- **Causa:** Query sin índice en tabla `tournament_results`
- **Solución:** Agregado índice en columna `player_id`
- **Prevención:** Revisar queries antes de deploy

## 2026-01-05 - Intentos de Login Fallidos
- **Severidad:** Nivel 1 (Advertencia)
- **Duración:** 2 horas
- **Causa:** Usuario olvidó contraseña
- **Solución:** Reset de contraseña
- **Prevención:** N/A (comportamiento normal)
```

---

## 🎯 Objetivos de Seguridad

### Corto Plazo (1 mes)
- [ ] 0 errores 500 no resueltos
- [ ] Tiempo de respuesta promedio < 500ms
- [ ] 100% de uptime

### Mediano Plazo (3 meses)
- [ ] Implementar Sentry
- [ ] Configurar Uptime Robot
- [ ] Automatizar backups semanales

### Largo Plazo (6 meses)
- [ ] Certificación HSTS Preload
- [ ] Auditoría de seguridad profesional
- [ ] Implementar WAF (Web Application Firewall)

---

**Última actualización:** 2026-01-06  
**Responsable:** Equipo ThePlayer.gg  
**Próxima revisión:** 2026-02-06

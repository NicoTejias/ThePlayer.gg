# 🔒 Guía de Seguridad - ThePlayer.gg

## 📋 Índice
1. [Cabeceras de Seguridad HTTP](#cabeceras-de-seguridad-http)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Seguridad del Frontend](#seguridad-del-frontend)
4. [Autenticación y Autorización](#autenticación-y-autorización)
5. [Protección contra Ataques Comunes](#protección-contra-ataques-comunes)
6. [Monitoreo y Auditoría](#monitoreo-y-auditoría)
7. [Checklist de Seguridad](#checklist-de-seguridad)

---

## 🛡️ Cabeceras de Seguridad HTTP

### Implementación en Vercel

Ya hemos configurado `vercel.json` con las siguientes cabeceras:

#### 1. **Content-Security-Policy (CSP)**
```
default-src 'self'; 
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co;
```

**Qué hace:** Previene ataques XSS controlando qué recursos puede cargar tu sitio.

**⚠️ IMPORTANTE:** Después del deploy inicial, deberías:
- Eliminar `'unsafe-inline'` y `'unsafe-eval'` gradualmente
- Usar nonces o hashes para scripts inline
- Monitorear violaciones CSP en la consola

#### 2. **Strict-Transport-Security (HSTS)**
```
max-age=63072000; includeSubDomains; preload
```

**Qué hace:** Fuerza HTTPS en todas las conexiones (2 años).

**Acción requerida:** Registra tu dominio en [hstspreload.org](https://hstspreload.org/) para máxima protección.

#### 3. **X-Frame-Options**
```
DENY
```

**Qué hace:** Previene clickjacking bloqueando que tu sitio se cargue en iframes.

#### 4. **X-Content-Type-Options**
```
nosniff
```

**Qué hace:** Previene que el navegador "adivine" tipos MIME incorrectos.

#### 5. **Referrer-Policy**
```
strict-origin-when-cross-origin
```

**Qué hace:** Controla cuánta información del referrer se envía en las peticiones.

#### 6. **Permissions-Policy**
```
camera=(), microphone=(), geolocation=(), interest-cohort=()
```

**Qué hace:** Desactiva APIs del navegador que no necesitas (incluye anti-FLoC de Google).

---

## 🔐 Configuración de Supabase

### 1. Row Level Security (RLS)

**CRÍTICO:** Todas las tablas deben tener RLS habilitado.

```sql
-- Verificar que RLS está habilitado en todas las tablas
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Si alguna tabla aparece, habilitar RLS:
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;
```

### 2. Políticas RLS Recomendadas

#### Tabla `profiles`
```sql
-- Lectura pública (solo campos públicos)
CREATE POLICY "Public profiles viewable by all"
ON profiles FOR SELECT
USING (true);

-- Usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

#### Tabla `tournament_results`
```sql
-- Solo tiendas aprobadas pueden insertar
CREATE POLICY "Approved stores can insert results"
ON tournament_results FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'store'
    AND status = 'approved'
  )
);

-- Lectura pública
CREATE POLICY "Anyone can view results"
ON tournament_results FOR SELECT
USING (true);
```

#### Tabla `marketplace_listings`
```sql
-- Solo usuarios autenticados pueden crear
CREATE POLICY "Auth users can create listings"
ON marketplace_listings FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Solo el dueño puede actualizar/eliminar
CREATE POLICY "Owners can update own listings"
ON marketplace_listings FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "Owners can delete own listings"
ON marketplace_listings FOR DELETE
USING (auth.uid() = seller_id);
```

### 3. Funciones SQL Seguras

**Siempre usa `SECURITY DEFINER` con cuidado:**

```sql
-- ❌ MAL - Expone datos sensibles
CREATE FUNCTION get_all_emails()
RETURNS TABLE(email TEXT)
SECURITY DEFINER
AS $$
  SELECT email FROM auth.users;
$$ LANGUAGE SQL;

-- ✅ BIEN - Valida permisos
CREATE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON
SECURITY DEFINER
AS $$
BEGIN
  -- Solo el usuario o admin puede ver
  IF auth.uid() != p_user_id AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN (SELECT json_build_object(
    'pwp', pwp,
    'wins', matches_won
  ) FROM profiles WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql;
```

### 4. Variables de Entorno

**Nunca expongas en el frontend:**
- `SUPABASE_SERVICE_ROLE_KEY` (solo backend)
- Claves API privadas
- Secretos de OAuth

**Usa en `.env.local`:**
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (clave pública, OK exponer)
```

---

## 🖥️ Seguridad del Frontend

### 1. Sanitización de Inputs

```tsx
// ❌ MAL - Vulnerable a XSS
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ BIEN - Sanitiza con DOMPurify
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userInput) 
}} />
```

### 2. Validación de Datos

```tsx
// Instalar: npm install zod
import { z } from 'zod';

const ProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  bio: z.string().max(500).optional()
});

// Validar antes de enviar
try {
  const validData = ProfileSchema.parse(formData);
  await supabase.from('profiles').update(validData);
} catch (error) {
  // Manejar error de validación
}
```

### 3. Protección de Rutas

```tsx
// En App.tsx
const ProtectedRoute = ({ children, requiredRole }: { 
  children: React.ReactNode, 
  requiredRole?: string 
}) => {
  const { userRole, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Uso:
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

### 4. Rate Limiting en el Cliente

```tsx
// Prevenir spam de formularios
import { useState, useCallback } from 'react';

const useRateLimit = (limit: number, windowMs: number) => {
  const [attempts, setAttempts] = useState<number[]>([]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    const recentAttempts = attempts.filter(t => now - t < windowMs);
    
    if (recentAttempts.length >= limit) {
      return false; // Bloqueado
    }
    
    setAttempts([...recentAttempts, now]);
    return true; // Permitido
  }, [attempts, limit, windowMs]);

  return checkLimit;
};

// Uso en formulario
const checkRateLimit = useRateLimit(5, 60000); // 5 intentos por minuto

const handleSubmit = async () => {
  if (!checkRateLimit()) {
    toast.error('Demasiados intentos. Espera un momento.');
    return;
  }
  // ... resto del código
};
```

---

## 🔑 Autenticación y Autorización

### 1. Configuración de Supabase Auth

**En Supabase Dashboard → Authentication → Settings:**

- ✅ **Enable Email Confirmations** (activado)
- ✅ **Secure email change** (requiere confirmación)
- ✅ **Enable phone confirmations** (si usas SMS)
- ⚠️ **Disable signups** (solo si quieres registro por invitación)

### 2. Configuración de OAuth Segura

**Google OAuth:**
```
Authorized redirect URIs:
- https://theplayer.gg/auth/callback
- https://*.supabase.co/auth/v1/callback

Authorized JavaScript origins:
- https://theplayer.gg
```

**⚠️ NUNCA uses:**
- `http://localhost` en producción
- Wildcards amplios como `https://*`

### 3. Gestión de Sesiones

```tsx
// Configurar timeout de sesión
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Más seguro que 'implicit'
  }
});

// Logout seguro
const handleLogout = async () => {
  await supabase.auth.signOut({ scope: 'global' }); // Cierra todas las sesiones
  localStorage.clear(); // Limpia datos locales
  navigate('/logout-success');
};
```

### 4. Tokens y Refresh

```tsx
// Verificar token antes de operaciones sensibles
const verifySession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    // Sesión expirada, forzar re-login
    await supabase.auth.signOut();
    navigate('/login');
    return false;
  }
  
  return true;
};

// Uso antes de operaciones críticas
const deleteAccount = async () => {
  if (!await verifySession()) return;
  // ... proceder con eliminación
};
```

---

## 🛡️ Protección contra Ataques Comunes

### 1. XSS (Cross-Site Scripting)

**Prevención:**
- ✅ Usa React (escapa automáticamente)
- ✅ Sanitiza HTML con DOMPurify
- ✅ CSP configurado
- ❌ NUNCA uses `eval()` o `Function()` con input de usuario

```tsx
// ❌ PELIGROSO
const userCode = getUserInput();
eval(userCode); // ¡NO HAGAS ESTO!

// ✅ SEGURO
const userName = getUserInput();
<div>{userName}</div> // React escapa automáticamente
```

### 2. CSRF (Cross-Site Request Forgery)

**Prevención:**
- ✅ Supabase usa tokens JWT (inmune a CSRF)
- ✅ SameSite cookies configuradas
- ✅ Verifica `Origin` header en operaciones sensibles

```tsx
// Supabase maneja esto automáticamente, pero puedes añadir:
const sensitiveAction = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No authenticated');
  }
  
  // Verificar que el token es reciente (< 5 min)
  const tokenAge = Date.now() - new Date(session.expires_at!).getTime();
  if (tokenAge > 300000) {
    await supabase.auth.refreshSession();
  }
  
  // Proceder con acción
};
```

### 3. SQL Injection

**Prevención:**
- ✅ Supabase usa consultas parametrizadas
- ✅ NUNCA construyas SQL manualmente

```sql
-- ❌ VULNERABLE
CREATE FUNCTION search_users(p_query TEXT)
RETURNS SETOF profiles
AS $$
BEGIN
  -- ¡PELIGRO! Inyección SQL
  RETURN QUERY EXECUTE 'SELECT * FROM profiles WHERE username = ' || p_query;
END;
$$ LANGUAGE plpgsql;

-- ✅ SEGURO
CREATE FUNCTION search_users(p_query TEXT)
RETURNS SETOF profiles
AS $$
BEGIN
  -- Usa parámetros, no concatenación
  RETURN QUERY 
  SELECT * FROM profiles 
  WHERE username = p_query;
END;
$$ LANGUAGE plpgsql;
```

### 4. Clickjacking

**Prevención:**
- ✅ `X-Frame-Options: DENY` configurado
- ✅ CSP `frame-ancestors 'none'`

### 5. DDoS / Rate Limiting

**Implementar en Supabase:**

```sql
-- Crear tabla para tracking de rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Función de rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Contar requests en la ventana de tiempo
  SELECT COUNT(*) INTO v_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  IF v_count >= p_max_requests THEN
    RETURN FALSE; -- Bloqueado
  END IF;
  
  -- Registrar request
  INSERT INTO rate_limits (user_id, endpoint)
  VALUES (p_user_id, p_endpoint);
  
  RETURN TRUE; -- Permitido
END;
$$;
```

**Uso en el frontend:**

```tsx
const uploadTournament = async (data: TournamentData) => {
  // Verificar rate limit
  const { data: allowed } = await supabase.rpc('check_rate_limit', {
    p_user_id: user.id,
    p_endpoint: 'upload_tournament',
    p_max_requests: 10,
    p_window_minutes: 60
  });
  
  if (!allowed) {
    toast.error('Límite de uploads alcanzado. Intenta en 1 hora.');
    return;
  }
  
  // Proceder con upload
};
```

---

## 📊 Monitoreo y Auditoría

### 1. Logging de Eventos Sensibles

```sql
-- Tabla de auditoría
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para auditar cambios en profiles
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_audit_trigger
AFTER UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION audit_profile_changes();
```

### 2. Monitoreo de Supabase

**En Supabase Dashboard:**
- Revisa **Logs** diariamente
- Configura **Alertas** para:
  - Picos de tráfico inusuales
  - Errores 500 frecuentes
  - Intentos de login fallidos
  - Cambios en RLS policies

### 3. Análisis de Seguridad

**Herramientas recomendadas:**
- [Mozilla Observatory](https://observatory.mozilla.org/) - Analiza cabeceras
- [Security Headers](https://securityheaders.com/) - Evalúa configuración
- [Snyk](https://snyk.io/) - Escanea dependencias vulnerables
- [OWASP ZAP](https://www.zaproxy.org/) - Pruebas de penetración

---

## ✅ Checklist de Seguridad

### Pre-Lanzamiento

- [ ] **Cabeceras HTTP configuradas** (`vercel.json`)
- [ ] **HTTPS forzado** (HSTS habilitado)
- [ ] **RLS habilitado** en todas las tablas
- [ ] **Políticas RLS revisadas** y testeadas
- [ ] **Variables de entorno** seguras (no exponer service_role)
- [ ] **CSP configurado** y testeado
- [ ] **OAuth redirects** validados
- [ ] **Email confirmation** habilitado
- [ ] **Rate limiting** implementado en endpoints críticos
- [ ] **Inputs sanitizados** (DOMPurify instalado)
- [ ] **Dependencias actualizadas** (`npm audit`)
- [ ] **Logs de auditoría** configurados
- [ ] **Backup automático** de Supabase habilitado

### Post-Lanzamiento

- [ ] **Registrar en HSTS Preload** (hstspreload.org)
- [ ] **Configurar alertas** en Supabase
- [ ] **Monitoreo semanal** de logs
- [ ] **Escaneo mensual** con OWASP ZAP
- [ ] **Revisión trimestral** de permisos RLS
- [ ] **Actualizar dependencias** mensualmente
- [ ] **Revisar CSP violations** en consola

### Mantenimiento Continuo

- [ ] **Rotación de secretos** cada 6 meses
- [ ] **Auditoría de usuarios** inactivos
- [ ] **Revisar logs de auditoría** semanalmente
- [ ] **Actualizar políticas** según nuevas features
- [ ] **Entrenar equipo** en mejores prácticas

---

## 🚨 Respuesta a Incidentes

### Si detectas una brecha de seguridad:

1. **Contener:**
   - Deshabilita el endpoint afectado
   - Revoca tokens comprometidos
   - Bloquea IPs sospechosas

2. **Investigar:**
   - Revisa logs de auditoría
   - Identifica alcance del daño
   - Documenta todo

3. **Remediar:**
   - Parchea la vulnerabilidad
   - Fuerza reset de contraseñas si es necesario
   - Actualiza políticas RLS

4. **Comunicar:**
   - Notifica a usuarios afectados
   - Publica post-mortem (si es grave)
   - Reporta a autoridades si aplica

---

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Vercel Security](https://vercel.com/docs/security)

---

**Última actualización:** 2026-01-06  
**Responsable:** Equipo ThePlayer.gg  
**Revisión:** Trimestral

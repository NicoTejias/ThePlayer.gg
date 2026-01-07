# 🧪 Plan de Testing de Seguridad - ThePlayer.gg

## 📋 Checklist de Pruebas

### ✅ = Pasó | ❌ = Falló | ⏳ = Pendiente

---

## 1. CABECERAS HTTP DE SEGURIDAD

### Test 1.1: Verificar Content-Security-Policy
**Objetivo:** Confirmar que CSP está bloqueando scripts inline maliciosos

**Pasos:**
1. Abre https://theplayer.gg
2. Abre DevTools (F12) → Console
3. Ejecuta: `eval('alert("XSS")')`
4. **Resultado esperado:** Error de CSP bloqueando la ejecución

**Estado:** ⏳

---

### Test 1.2: Verificar X-Frame-Options
**Objetivo:** Confirmar que el sitio no puede ser embebido en iframe

**Pasos:**
1. Crea un archivo HTML temporal:
```html
<!DOCTYPE html>
<html>
<body>
    <iframe src="https://theplayer.gg"></iframe>
</body>
</html>
```
2. Abre el archivo en el navegador
3. **Resultado esperado:** El iframe debe estar vacío o mostrar error

**Estado:** ⏳

---

### Test 1.3: Verificar HSTS
**Objetivo:** Confirmar que HTTPS está forzado

**Pasos:**
1. Intenta acceder a http://theplayer.gg (sin 's')
2. **Resultado esperado:** Redirección automática a https://

**Estado:** ⏳

---

### Test 1.4: Escaneo Automático de Cabeceras
**Herramienta:** https://securityheaders.com

**Pasos:**
1. Ve a https://securityheaders.com
2. Ingresa: theplayer.gg
3. Haz clic en "Scan"
4. **Resultado esperado:** Calificación A o A+

**Estado:** ⏳

---

## 2. PROTECCIÓN CONTRA XSS

### Test 2.1: XSS en Formulario de Tienda
**Objetivo:** Verificar que inputs maliciosos son sanitizados

**Pasos:**
1. Ve a la página de Tiendas
2. Haz clic en "Únete a ThePlayer.gg"
3. En el campo "Nombre de la tienda", ingresa:
   ```
   <script>alert('XSS')</script>
   ```
4. Envía el formulario
5. **Resultado esperado:** 
   - El script NO debe ejecutarse
   - El texto debe guardarse escapado/sanitizado

**Estado:** ⏳

---

### Test 2.2: XSS en Perfil de Usuario
**Objetivo:** Verificar sanitización en actualización de perfil

**Pasos:**
1. Inicia sesión
2. Ve a Configuración
3. En el campo "Nombre", ingresa:
   ```
   <img src=x onerror=alert('XSS')>
   ```
4. Guarda cambios
5. Recarga la página
6. **Resultado esperado:** 
   - El script NO debe ejecutarse
   - El texto debe mostrarse escapado

**Estado:** ⏳

---

### Test 2.3: XSS en Alias de Jugador
**Objetivo:** Verificar sanitización en creación de alias

**Pasos:**
1. Ve a Configuración → Alias
2. Ingresa como alias:
   ```
   <svg onload=alert('XSS')>
   ```
3. Haz clic en "Agregar Alias"
4. **Resultado esperado:**
   - El script NO debe ejecutarse
   - Debe guardarse como texto plano

**Estado:** ⏳

---

## 3. VALIDACIÓN DE DATOS

### Test 3.1: Validación de Email
**Objetivo:** Verificar que emails inválidos son rechazados

**Pasos:**
1. Formulario de tienda → Campo email
2. Prueba estos valores:
   - `notanemail` → ❌ Debe rechazar
   - `test@` → ❌ Debe rechazar
   - `@example.com` → ❌ Debe rechazar
   - `test@example.com` → ✅ Debe aceptar

**Estado:** ⏳

---

### Test 3.2: Validación de Longitud de Texto
**Objetivo:** Verificar límites de caracteres

**Pasos:**
1. Formulario de tienda → Campo "Nombre de la tienda"
2. Ingresa solo 1 carácter → ❌ Debe rechazar (mínimo 3)
3. Ingresa 150 caracteres → ❌ Debe rechazar (máximo 100)
4. Ingresa 10 caracteres → ✅ Debe aceptar

**Estado:** ⏳

---

### Test 3.3: Validación de Teléfono
**Objetivo:** Verificar formato de teléfono

**Pasos:**
1. Formulario de tienda → Campo teléfono
2. Prueba:
   - `abc123` → ❌ Debe rechazar
   - `123` → ❌ Debe rechazar (muy corto)
   - `+56912345678` → ✅ Debe aceptar

**Estado:** ⏳

---

## 4. ROW LEVEL SECURITY (RLS)

### Test 4.1: Intentar Acceder a Datos de Otro Usuario
**Objetivo:** Verificar que RLS previene acceso no autorizado

**Pasos:**
1. Abre DevTools → Console
2. Ejecuta:
```javascript
// Intenta leer todos los perfiles (debería funcionar - lectura pública)
const { data } = await supabase.from('profiles').select('*');
console.log('Perfiles visibles:', data.length);

// Intenta actualizar el perfil de otro usuario (debería fallar)
const { error } = await supabase
  .from('profiles')
  .update({ username: 'HACKED' })
  .eq('id', 'UUID-DE-OTRO-USUARIO');
console.log('Error esperado:', error);
```
3. **Resultado esperado:**
   - Lectura: OK (políticas permiten SELECT público)
   - Escritura: ERROR (solo puedes editar tu propio perfil)

**Estado:** ⏳

---

### Test 4.2: Intentar Insertar Resultados de Torneo sin Permisos
**Objetivo:** Verificar que solo tiendas aprobadas pueden insertar

**Pasos:**
1. Como usuario normal (no tienda), intenta:
```javascript
const { error } = await supabase
  .from('tournament_results')
  .insert({
    tournament_id: 'UUID-CUALQUIERA',
    player_id: 'UUID-CUALQUIERA',
    placement: 1
  });
console.log('Error esperado:', error);
```
2. **Resultado esperado:** ERROR de RLS policy

**Estado:** ⏳

---

## 5. SANITIZACIÓN DE URLs

### Test 5.1: URL Maliciosa en Avatar
**Objetivo:** Verificar que URLs peligrosas son bloqueadas

**Pasos:**
1. Configuración → Avatar URL
2. Ingresa:
   ```
   javascript:alert('XSS')
   ```
3. Guarda
4. **Resultado esperado:** 
   - URL debe ser reemplazada por '#' o rechazada
   - NO debe ejecutarse código

**Estado:** ⏳

---

## 6. PROTECCIÓN CONTRA INYECCIÓN SQL

### Test 6.1: Intentar Inyección SQL en Búsqueda
**Objetivo:** Verificar que Supabase previene SQL injection

**Pasos:**
1. En cualquier campo de búsqueda, ingresa:
   ```
   '; DROP TABLE profiles; --
   ```
2. **Resultado esperado:**
   - Búsqueda sin resultados o error normal
   - La tabla NO debe eliminarse (Supabase usa queries parametrizadas)

**Estado:** ⏳

---

## 7. RENDIMIENTO Y DISPONIBILIDAD

### Test 7.1: Tiempo de Carga
**Objetivo:** Verificar que el sitio carga rápido

**Pasos:**
1. Abre DevTools → Network
2. Recarga la página
3. Mira el tiempo de carga total
4. **Resultado esperado:** < 3 segundos

**Estado:** ⏳

---

### Test 7.2: Verificar Uptime
**Objetivo:** Confirmar que el sitio está disponible

**Pasos:**
1. Ve a https://theplayer.gg
2. **Resultado esperado:** Sitio carga correctamente

**Estado:** ⏳

---

## 8. AUTENTICACIÓN Y SESIONES

### Test 8.1: Logout Seguro
**Objetivo:** Verificar que el logout limpia la sesión

**Pasos:**
1. Inicia sesión
2. Haz logout
3. Intenta acceder a /dashboard/jugador directamente
4. **Resultado esperado:** Redirección a /login

**Estado:** ⏳

---

### Test 8.2: Protección de Rutas
**Objetivo:** Verificar que rutas protegidas requieren autenticación

**Pasos:**
1. Sin iniciar sesión, intenta acceder a:
   - /dashboard/jugador
   - /dashboard/tienda
   - /settings
2. **Resultado esperado:** Redirección a /login

**Estado:** ⏳

---

## 9. HEALTH CHECK DEL SISTEMA

### Test 9.1: Ejecutar Health Check SQL
**Objetivo:** Verificar estado general del sistema

**Pasos:**
1. Ve a Supabase SQL Editor
2. Ejecuta `docs/HEALTH_CHECK.sql`
3. **Resultado esperado:** Todos los checks con ✅

**Estado:** ⏳

---

## 10. AUDITORÍA RLS

### Test 10.1: Ejecutar Auditoría de Seguridad
**Objetivo:** Verificar que todas las tablas tienen RLS

**Pasos:**
1. Ve a Supabase SQL Editor
2. Ejecuta `docs/SECURITY_AUDIT_SIMPLE.sql`
3. **Resultado esperado:**
   - 0 tablas sin RLS
   - 0 tablas sin políticas

**Estado:** ⏳

---

## 📊 RESUMEN DE RESULTADOS

| Categoría | Tests | Pasados | Fallados | Pendientes |
|-----------|-------|---------|----------|------------|
| Cabeceras HTTP | 4 | 0 | 0 | 4 |
| Protección XSS | 3 | 0 | 0 | 3 |
| Validación | 3 | 0 | 0 | 3 |
| RLS | 2 | 0 | 0 | 2 |
| Sanitización URLs | 1 | 0 | 0 | 1 |
| SQL Injection | 1 | 0 | 0 | 1 |
| Rendimiento | 2 | 0 | 0 | 2 |
| Autenticación | 2 | 0 | 0 | 2 |
| Health Check | 1 | 0 | 0 | 1 |
| Auditoría RLS | 1 | 0 | 0 | 1 |
| **TOTAL** | **20** | **0** | **0** | **20** |

---

## 🐛 BUGS ENCONTRADOS

_Documentar aquí cualquier problema encontrado durante las pruebas_

---

## ✅ ACCIONES CORRECTIVAS

_Documentar aquí las soluciones implementadas_

---

**Fecha de testing:** 2026-01-06  
**Tester:** [Tu nombre]  
**Próxima revisión:** Mensual

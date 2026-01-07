# 🧪 Guía de Testing Manual de Seguridad

## ✅ Tests que DEBES ejecutar cuando el sitio esté en producción

---

## 1. TEST DE CABECERAS HTTP (5 minutos)

### Opción A: Usando SecurityHeaders.com (Recomendado)

1. Ve a: https://securityheaders.com
2. Ingresa tu dominio: `theplayer.gg`
3. Haz clic en "Scan"
4. **Resultado esperado:** Calificación **A** o **A+**

### Opción B: Usando el Navegador

1. Abre https://theplayer.gg
2. Presiona **F12** (DevTools)
3. Ve a la pestaña **Network**
4. Recarga la página (**Ctrl+R**)
5. Haz clic en el primer request (generalmente el HTML principal)
6. Ve a la pestaña **Headers**
7. Busca en "Response Headers":

**Debes ver:**
```
✅ x-frame-options: DENY
✅ x-content-type-options: nosniff
✅ strict-transport-security: max-age=63072000; includeSubDomains; preload
✅ content-security-policy: default-src 'self'; ...
✅ referrer-policy: strict-origin-when-cross-origin
✅ permissions-policy: camera=(), microphone=(), ...
```

---

## 2. TEST DE PROTECCIÓN XSS (10 minutos)

### Test 2.1: XSS en Formulario de Tienda

1. Ve a tu sitio → **Página de Tiendas**
2. Haz clic en **"Únete a ThePlayer.gg"**
3. En el campo **"Nombre de la tienda"**, copia y pega:
   ```html
   <script>alert('XSS Test')</script>
   ```
4. Completa los demás campos con datos válidos
5. Haz clic en **"Enviar"**

**✅ PASÓ si:**
- NO aparece un alert
- El formulario se envía correctamente
- El texto se guarda como texto plano (sin ejecutar)

**❌ FALLÓ si:**
- Aparece un alert con "XSS Test"
- El navegador ejecuta el script

---

### Test 2.2: XSS en Perfil de Usuario

1. Inicia sesión en tu sitio
2. Ve a **Configuración** (Settings)
3. En el campo **"Nombre"**, ingresa:
   ```html
   <img src=x onerror=alert('XSS')>
   ```
4. Haz clic en **"Guardar Cambios"**
5. Recarga la página

**✅ PASÓ si:**
- NO aparece un alert
- El texto se muestra escapado o sanitizado

**❌ FALLÓ si:**
- Aparece un alert
- Se ejecuta código JavaScript

---

### Test 2.3: XSS en Alias

1. En **Configuración** → Sección **"Alias"**
2. En el campo de nuevo alias, ingresa:
   ```html
   <svg onload=alert('XSS')>
   ```
3. Haz clic en **"Agregar Alias"**

**✅ PASÓ si:**
- NO aparece un alert
- El alias se guarda como texto plano

**❌ FALLÓ si:**
- Aparece un alert

---

## 3. TEST DE VALIDACIÓN DE DATOS (5 minutos)

### Test 3.1: Email Inválido

1. Formulario de tienda → Campo **"Email"**
2. Prueba estos valores:

| Input | Resultado Esperado |
|-------|-------------------|
| `notanemail` | ❌ Rechazado con mensaje de error |
| `test@` | ❌ Rechazado |
| `@example.com` | ❌ Rechazado |
| `test@example.com` | ✅ Aceptado |

---

### Test 3.2: Longitud de Texto

1. Formulario de tienda → **"Nombre de la tienda"**
2. Prueba:

| Input | Resultado Esperado |
|-------|-------------------|
| `AB` (2 caracteres) | ❌ Rechazado (mínimo 3) |
| `ABC` (3 caracteres) | ✅ Aceptado |
| 150 caracteres | ❌ Rechazado (máximo 100) |

---

### Test 3.3: Teléfono

1. Formulario de tienda → **"Teléfono"**
2. Prueba:

| Input | Resultado Esperado |
|-------|-------------------|
| `abc123` | ❌ Rechazado |
| `123` | ❌ Rechazado (muy corto) |
| `+56912345678` | ✅ Aceptado |

---

## 4. TEST DE CLICKJACKING (2 minutos)

1. Crea un archivo HTML temporal en tu computadora:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test de Clickjacking</title>
</head>
<body>
    <h1>Test de Protección contra Clickjacking</h1>
    <p>Si ves el contenido de ThePlayer.gg abajo, el test FALLÓ:</p>
    <iframe src="https://theplayer.gg" width="800" height="600"></iframe>
</body>
</html>
```

2. Guárdalo como `test-clickjacking.html`
3. Ábrelo en tu navegador

**✅ PASÓ si:**
- El iframe está vacío o muestra un error
- NO se ve el contenido de ThePlayer.gg

**❌ FALLÓ si:**
- Se ve el contenido completo de ThePlayer.gg dentro del iframe

---

## 5. TEST DE HTTPS FORZADO (1 minuto)

1. En tu navegador, intenta acceder a:
   ```
   http://theplayer.gg
   ```
   (Sin la 's' en https)

**✅ PASÓ si:**
- Automáticamente redirige a `https://theplayer.gg`

**❌ FALLÓ si:**
- Se queda en HTTP sin redirigir

---

## 6. TEST DE AUTENTICACIÓN (5 minutos)

### Test 6.1: Logout Seguro

1. Inicia sesión
2. Haz logout
3. Intenta acceder directamente a:
   ```
   https://theplayer.gg/dashboard/jugador
   ```

**✅ PASÓ si:**
- Te redirige a `/login`

**❌ FALLÓ si:**
- Puedes ver el dashboard sin estar logueado

---

### Test 6.2: Protección de Rutas

Sin iniciar sesión, intenta acceder a:
- `/dashboard/jugador`
- `/dashboard/tienda`
- `/settings`

**✅ PASÓ si:**
- Todas redirigen a `/login`

**❌ FALLÓ si:**
- Puedes acceder sin autenticación

---

## 7. TEST DE RENDIMIENTO (2 minutos)

1. Abre DevTools (**F12**)
2. Ve a la pestaña **Network**
3. Recarga la página (**Ctrl+R**)
4. Mira el tiempo de carga total (abajo a la derecha)

**✅ PASÓ si:**
- Tiempo de carga < 3 segundos

**⚠️ ADVERTENCIA si:**
- Tiempo de carga entre 3-5 segundos

**❌ FALLÓ si:**
- Tiempo de carga > 5 segundos

---

## 8. TEST DE CONSOLA (1 minuto)

1. Abre DevTools (**F12**)
2. Ve a la pestaña **Console**
3. Recarga la página

**✅ PASÓ si:**
- No hay errores rojos
- Solo warnings amarillos menores (si los hay)

**❌ FALLÓ si:**
- Hay errores rojos
- Hay violaciones de CSP

---

## 📊 RESUMEN DE RESULTADOS

Completa esta tabla después de ejecutar todos los tests:

| Test | Estado | Notas |
|------|--------|-------|
| 1. Cabeceras HTTP | ⏳ | |
| 2.1 XSS Formulario Tienda | ⏳ | |
| 2.2 XSS Perfil Usuario | ⏳ | |
| 2.3 XSS Alias | ⏳ | |
| 3.1 Validación Email | ⏳ | |
| 3.2 Validación Longitud | ⏳ | |
| 3.3 Validación Teléfono | ⏳ | |
| 4. Clickjacking | ⏳ | |
| 5. HTTPS Forzado | ⏳ | |
| 6.1 Logout Seguro | ⏳ | |
| 6.2 Protección Rutas | ⏳ | |
| 7. Rendimiento | ⏳ | |
| 8. Consola Limpia | ⏳ | |

**Leyenda:**
- ✅ = Pasó
- ❌ = Falló
- ⏳ = Pendiente

---

## 🐛 SI ENCUENTRAS UN PROBLEMA

1. **Documenta:**
   - ¿Qué test falló?
   - ¿Qué esperabas que pasara?
   - ¿Qué pasó en realidad?
   - Captura de pantalla si es posible

2. **Registra en `docs/INCIDENT_LOG.md`:**
   ```markdown
   ## 2026-01-XX - [Nombre del problema]
   - **Severidad:** Nivel 1/2/3
   - **Test fallado:** [Nombre del test]
   - **Descripción:** [Qué pasó]
   - **Solución:** [Qué se hizo para arreglarlo]
   ```

3. **Arregla:**
   - Revisa el código relacionado
   - Aplica el fix
   - Vuelve a testear

---

## 📅 FRECUENCIA DE TESTING

- **Después de cada deploy:** Tests 1, 2, 8
- **Semanal:** Todos los tests
- **Mensual:** Scan completo con SecurityHeaders.com

---

**Fecha de creación:** 2026-01-06  
**Última actualización:** 2026-01-06  
**Próxima revisión:** Después del primer deploy a producción

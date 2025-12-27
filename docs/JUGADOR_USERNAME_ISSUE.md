# Problema: Usuarios aparecen como "Jugador" después del registro

## Descripción del Problema

Cuando un usuario se registra (especialmente con Google OAuth), aparece con el username "Jugador" en lugar de su nombre real. Esto afecta la experiencia del usuario y hace que todos los nuevos usuarios se vean iguales.

## Causa Raíz

El problema ocurre en el flujo de creación de perfil en `App.tsx` (líneas 411-489). Cuando un usuario se registra:

1. **Registro con Email/Password**: 
   - Se envía `full_name: username` en el metadata de Supabase Auth
   - El perfil se crea automáticamente cuando el usuario inicia sesión por primera vez

2. **Registro con Google OAuth**:
   - Google proporciona metadata como `full_name`, `given_name`, `family_name`, `picture`, etc.
   - El código intenta extraer el nombre de este metadata

El código actual en `App.tsx` (líneas 416-419) tiene este fallback:

```typescript
const fullName = session.user.user_metadata.full_name ||
  session.user.user_metadata.name ||
  session.user.email?.split('@')[0] ||
  'User';
```

**El problema**: Si el metadata de Google no contiene `full_name` o `name`, el código usa el email antes del `@` o "User" como fallback. Sin embargo, parece que en algunos casos este valor se está guardando como "Jugador" en la base de datos.

## Posibles Causas

1. **Metadata de Google incompleto**: Google no siempre envía todos los campos de metadata
2. **Trigger de base de datos**: Puede haber un trigger que sobrescribe el username
3. **Problema de sincronización**: El perfil se crea antes de que el metadata esté disponible
4. **Problema con el campo `username`**: El campo puede tener un valor por defecto en la base de datos

## Soluciones

### Solución 1: Verificar y Actualizar Perfiles Existentes

Ejecuta el script `FIX_JUGADOR_USERNAME.sql` para:
1. Identificar todos los usuarios con username "Jugador"
2. Actualizarlos con su nombre completo (first_name + last_name) o email

### Solución 2: Mejorar el Flujo de Creación de Perfil

Modificar `App.tsx` para:
1. Solicitar el nombre al usuario si no está disponible en el metadata
2. Usar un modal de "Completar Perfil" para nuevos usuarios
3. Validar que el username no sea "Jugador" antes de guardar

### Solución 3: Verificar Configuración de Supabase

1. **Revisar triggers**: Verificar si hay triggers que modifiquen el username
2. **Revisar RLS policies**: Asegurarse de que las políticas permitan la creación correcta
3. **Revisar valores por defecto**: Verificar que la columna `username` no tenga un valor por defecto problemático

## Pasos Inmediatos

1. **Para Nemesio específicamente**:
   ```sql
   UPDATE profiles
   SET username = 'Nemesio'  -- O su nombre completo
   WHERE email = 'email_de_nemesio@gmail.com';
   ```

2. **Para todos los usuarios afectados**:
   - Ejecutar `FIX_JUGADOR_USERNAME.sql`
   - Verificar los resultados

3. **Prevenir el problema en el futuro**:
   - Implementar validación en el frontend
   - Mejorar el flujo de onboarding
   - Agregar logs para debugging

## Investigación Adicional Necesaria

Para resolver esto completamente, necesitamos:

1. **El email de Nemesio** para actualizar su perfil manualmente
2. **Verificar el metadata de Google** que se está recibiendo (agregar console.logs)
3. **Revisar la base de datos** para ver si hay triggers o funciones que modifiquen el username
4. **Probar el flujo de registro** con diferentes métodos (email, Google) para reproducir el problema

## Código para Debugging

Agregar estos console.logs en `App.tsx` (línea 415):

```typescript
console.log("=== CREATING NEW PROFILE ===");
console.log("User metadata:", session.user.user_metadata);
console.log("Full name extracted:", fullName);
console.log("Username to be used:", username);
```

Esto nos ayudará a ver exactamente qué datos se están recibiendo de Google y qué username se está generando.

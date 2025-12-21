# Gestión de Administradores - ThePlayer.gg

## 📋 Cuentas de Administrador Actuales

Las siguientes cuentas tienen privilegios de administrador:

- **nicotejias@gmail.com** (Principal)
- **nicolas.tejias@gmail.com** (Secundaria)

---

## ➕ Cómo Agregar un Nuevo Administrador

### Opción 1: Editar el Código (Recomendado)

1. **Edita el archivo de configuración:**
   ```
   d:\The Player\Pagina ranking\ThePlayer.gg\config\adminConfig.ts
   ```

2. **Agrega el nuevo email a la lista:**
   ```typescript
   export const ADMIN_EMAILS = [
     'nicotejias@gmail.com',
     'nicolas.tejias@gmail.com',
     'nuevo.admin@example.com',  // ← Agregar aquí
   ];
   ```

3. **Actualiza la base de datos:**
   Ejecuta esta migración en Supabase SQL Editor:
   ```sql
   -- Actualizar política de RLS
   DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
   
   CREATE POLICY "Admins can update any profile"
   ON public.profiles
   FOR UPDATE
   USING (
     (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
       'nicotejias@gmail.com',
       'nicolas.tejias@gmail.com',
       'nuevo.admin@example.com'  -- ← Agregar aquí también
     )
   );

   -- Actualizar función de creación de usuarios
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger AS $$
   DECLARE
     user_role text;
     user_status text;
     admin_emails text[] := ARRAY[
       'nicotejias@gmail.com',
       'nicolas.tejias@gmail.com',
       'nuevo.admin@example.com'  -- ← Y aquí
     ];
   BEGIN
     IF new.email = ANY(admin_emails) THEN
       user_role := 'admin';
       user_status := 'active';
     ELSE
       user_role := COALESCE(new.raw_user_meta_data->>'role', 'player');
       IF user_role = 'store' THEN
         user_status := 'pending_approval';
       ELSE
         user_status := 'active';
       END IF;
     END IF;

     INSERT INTO public.profiles (id, email, username, role, region, avatar_url, status)
     VALUES (
       new.id,
       new.email,
       COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
       user_role,
       new.raw_user_meta_data->>'region',
       new.raw_user_meta_data->>'avatar_url',
       user_status
     );
     
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

### Opción 2: Cambiar Manualmente en la Base de Datos (Rápido pero temporal)

Si necesitas hacer admin a alguien que ya tiene cuenta:

```sql
UPDATE public.profiles 
SET role = 'admin', status = 'active'
WHERE email = 'email.del.nuevo.admin@example.com';
```

⚠️ **Nota:** Este cambio es temporal. Si el usuario se registra de nuevo o hay cambios en el trigger, perderá el rol de admin. Usa la Opción 1 para cambios permanentes.

---

## ❌ Cómo Quitar un Administrador

1. **Elimina el email de `adminConfig.ts`**
2. **Actualiza la política de RLS** (quita el email de la lista)
3. **Actualiza la función `handle_new_user`** (quita el email del array)
4. **Opcional:** Cambia el rol en la base de datos:
   ```sql
   UPDATE public.profiles 
   SET role = 'player'
   WHERE email = 'admin.a.remover@example.com';
   ```

---

## 🔒 Privilegios de Administrador

Los administradores tienen acceso a:

- ✅ Panel de Administración (`/admin`)
- ✅ Aprobar/Rechazar tiendas
- ✅ Ver todos los perfiles de usuarios
- ✅ Actualizar cualquier perfil en la base de datos
- ✅ Ver estadísticas globales
- ✅ Gestionar torneos y resultados

---

## 📝 Notas Importantes

- Los emails de administrador se verifican en **3 lugares**:
  1. `config/adminConfig.ts` (Frontend)
  2. Política RLS en Supabase (Base de datos)
  3. Función `handle_new_user` (Trigger de base de datos)

- **Siempre actualiza los 3 lugares** para mantener la consistencia.

- Los administradores se crean automáticamente con `status: 'active'` al registrarse.

- No necesitan aprobación manual como las tiendas.

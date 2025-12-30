# Instrucciones para Ejecutar la Migración

## Paso 1: Ejecutar la Migración SQL

### Opción A: Usando Supabase Dashboard (Recomendado)

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto de ThePlayer.gg
3. En el menú lateral, ve a **SQL Editor**
4. Haz clic en **New Query**
5. Copia y pega el contenido del archivo `docs/ADD_GAME_TYPE_TO_PROFILES.sql`
6. Haz clic en **Run** (o presiona Ctrl+Enter)
7. Verifica que la migración se ejecutó sin errores

### Opción B: Usando CLI de Supabase

```bash
cd "d:\The Player\Pagina ranking\ThePlayer.gg"
supabase db push
```

## Paso 2: Verificar la Migración

Ejecuta esta query para verificar que la columna se agregó correctamente:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'game_type';
```

Deberías ver:
- `column_name`: game_type
- `data_type`: text
- `column_default`: 'mtg'::text

## Paso 3: Verificar el Índice

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles' AND indexname = 'idx_profiles_game_type';
```

## Paso 4: Actualizar Jugadores Existentes (Opcional)

La migración ya incluye una query que actualiza automáticamente el `game_type` de jugadores existentes basándose en su historial de torneos.

Para verificar cuántos jugadores fueron actualizados:

```sql
SELECT game_type, COUNT(*) as count
FROM profiles
WHERE role = 'player'
GROUP BY game_type
ORDER BY count DESC;
```

## Paso 5: Probar en la Aplicación

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a la página de Rankings: `http://localhost:5173/#/ranking/pwp`

3. Cambia el juego usando el selector en el header

4. Verifica que:
   - La tabla de rankings se filtra correctamente
   - El título cambia según el juego seleccionado
   - Solo se muestran jugadores del juego seleccionado

5. Ve a la página de Videos: `http://localhost:5173/#/media/videos`

6. Cambia el juego y verifica que los videos se filtran correctamente

## Paso 6: Actualizar Jugadores Manualmente (Si es necesario)

Si algunos jugadores no tienen `game_type` asignado, puedes actualizarlos manualmente:

```sql
-- Actualizar un jugador específico
UPDATE profiles 
SET game_type = 'pokemon' 
WHERE id = 'user-id-here';

-- Actualizar todos los jugadores sin game_type a MTG
UPDATE profiles 
SET game_type = 'mtg' 
WHERE game_type IS NULL AND role = 'player';
```

## Paso 7: Agregar game_type al Registro de Nuevos Usuarios

Necesitarás actualizar el formulario de registro para que los nuevos usuarios seleccionen su juego principal. Esto se puede hacer en:

- `pages/AuthPage.tsx` - Agregar selector de juego en el formulario de registro
- `App.tsx` - Actualizar la lógica de creación de perfil para incluir `game_type`

## Rollback (Si algo sale mal)

Si necesitas revertir la migración:

```sql
-- Eliminar el índice
DROP INDEX IF EXISTS idx_profiles_game_type;

-- Eliminar la restricción
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_game_type;

-- Eliminar la columna
ALTER TABLE profiles DROP COLUMN IF EXISTS game_type;
```

## Notas Importantes

- ✅ La migración es **no destructiva** - no elimina ni modifica datos existentes
- ✅ El valor por defecto es `'mtg'` para mantener compatibilidad
- ✅ Los jugadores sin historial de torneos quedarán con `game_type = 'mtg'`
- ⚠️ Asegúrate de hacer backup de la base de datos antes de ejecutar en producción
- ⚠️ Prueba primero en un ambiente de desarrollo/staging

## Próximos Pasos

Después de ejecutar la migración:

1. [ ] Actualizar formulario de registro para capturar `game_type`
2. [ ] Agregar opción en Settings para que usuarios cambien su `game_type`
3. [ ] Considerar permitir múltiples juegos por usuario (tabla intermedia)
4. [ ] Actualizar la lógica de cálculo de rankings para considerar `game_type`

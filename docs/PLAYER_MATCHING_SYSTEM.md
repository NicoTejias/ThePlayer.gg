# Sistema de Matching de Jugadores - ThePlayer.gg

## El Problema

Cuando se sube un torneo desde Melee o EventLink, los nombres de los jugadores vienen en el formato del archivo original (ej: "Patricio Roman", "Roman, Patricio", etc.). Estos nombres **no siempre coinciden exactamente** con los usernames registrados en la plataforma.

## La Solución: Sistema de Aliases

### ¿Cómo funciona?

1. **Cada jugador registrado puede agregar "aliases"** en su perfil (Settings → Nombres de Competencia)
2. **Cuando se sube un torneo**, el sistema busca el nombre del CSV en:
   - Los aliases registrados en `player_aliases`
   - El username del perfil
   - La combinación de first_name + last_name
3. **Si encuentra un match**, actualiza el PWP del jugador
4. **Si no encuentra match**, el resultado se guarda pero sin vincular a un perfil

### Flujo de Matching

```
Nombre en CSV: "Patricio Roman"
         ↓
1. ¿Existe en player_aliases? → "Patricio Roman" registrado por usuario X → ✅ Match
         ↓ (si no)
2. ¿Existe como username? → username = "patricio roman" → ✅ Match
         ↓ (si no)
3. ¿Es first_name + last_name? → first_name="Patricio", last_name="Roman" → ✅ Match
         ↓ (si no)
4. ❌ No hay match → El resultado se guarda con player_id = NULL
```

## Instrucciones para Actualizar Supabase

### Paso 1: Ejecutar el SQL

1. Ve a tu **Supabase Dashboard**
2. Abre **SQL Editor**
3. Copia y pega todo el contenido de `docs/supabase_rpc_functions.sql`
4. Click en **Run**

### Paso 2: Verificar las funciones

Ejecuta este query para verificar que las funciones existen:

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_tournament_via_rpc', 'process_tournament_results_bulk');
```

Debería retornar 2 filas.

### Paso 3: Verificar la tabla player_aliases

```sql
SELECT * FROM player_aliases LIMIT 5;
```

Si no hay datos, es normal. Los jugadores deben agregar sus aliases desde Settings.

## ¿Por qué los rankings no se actualizan?

### Causa probable 1: Jugadores sin registro
Los jugadores del CSV de Melee (ej: "Patricio Roman") probablemente **no tienen cuenta en la plataforma**, o si la tienen, no coincide exactamente el nombre.

**Solución**: Los jugadores deben:
1. Registrarse en la plataforma
2. Ir a Settings → Nombres de Competencia
3. Agregar su nombre exacto como aparece en los torneos

### Causa probable 2: Función RPC desactualizada
La función `process_tournament_results_bulk` en Supabase puede no estar usando la lógica de matching con aliases.

**Solución**: Ejecutar el SQL de `docs/supabase_rpc_functions.sql`

### Causa probable 3: Tabla player_aliases no existe
Si la tabla no existe, el sistema no puede hacer matching.

**Solución**: Ejecutar el SQL que crea la tabla

## Ejemplo Práctico

### Escenario:
- El CSV tiene un jugador: `"Patricio Roman"` con 22 puntos
- Existe un usuario en la plataforma con username: `"TakayamaMTG"`

### Problema:
Sin aliases configurados, el sistema NO puede saber que "Patricio Roman" = "TakayamaMTG"

### Solución:
El usuario "TakayamaMTG" debe ir a Settings y agregar el alias `"Patricio Roman"`

```
Settings → Nombres de Competencia → "Patricio Roman" → [Agregar Alias]
```

Ahora, la próxima vez que se suba un torneo con "Patricio Roman", los 22 puntos se sumarán automáticamente al perfil de TakayamaMTG.

## Resumen

| Paso | Quién lo hace | Descripción |
|------|---------------|-------------|
| 1 | Admin | Ejecutar SQL en Supabase para actualizar funciones RPC |
| 2 | Jugadores | Registrarse y agregar aliases con su nombre de torneo |
| 3 | Tienda | Subir el CSV del torneo |
| 4 | Sistema | Busca cada nombre → Match con alias/username → Actualiza PWP |

## Verificar que funciona

Después de ejecutar el SQL y que al menos un jugador agregue su alias:

1. Sube un torneo de prueba
2. Revisa la consola del navegador para ver logs
3. Revisa en Supabase:
   ```sql
   -- Ver los resultados del último torneo
   SELECT * FROM tournament_results ORDER BY created_at DESC LIMIT 10;
   
   -- Ver si los player_id están siendo asignados
   SELECT player_name, player_id, pwp_earned 
   FROM tournament_results 
   WHERE player_id IS NOT NULL 
   ORDER BY created_at DESC;
   ```

Si `player_id` es NULL para todos, significa que no hubo matches (los jugadores necesitan registrar aliases).

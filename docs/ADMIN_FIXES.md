# Problemas Identificados y Soluciones

## 1. Discrepancia de Puntos PWP

### Problema
Sergio Campos y Alexander Ghio muestran diferentes puntos en:
- **Panel de Administración**: 21 y 26 puntos respectivamente
- **Ranking Público (PLS)**: 14 y 18 puntos respectivamente

### Causa Raíz
El sistema tiene **dos fuentes de verdad** para los puntos PWP:

1. **Columna `pwp` en tabla `profiles`**: 
   - Se actualiza cuando se suben torneos (función `process_tournament_results_bulk`)
   - Puede quedar desactualizada si se eliminan torneos o se corrigen resultados
   - **Es lo que muestra el panel de administración**

2. **Suma de `pwp_earned` en tabla `tournament_results`**:
   - Es la fuente real y siempre actualizada
   - **Es lo que muestra el ranking público**

### Solución Inmediata
Ejecutar el script SQL [`RECALCULATE_PWP.sql`](file:///d:/The%20Player/Pagina%20ranking/ThePlayer.gg/docs/RECALCULATE_PWP.sql) en Supabase:

```sql
-- Recalcular PWP de todos los jugadores
SELECT recalculate_all_players_pwp();

-- O solo para MTG:
SELECT recalculate_pwp_by_game('mtg');
```

### Solución a Largo Plazo
Modificar el panel de administración para que calcule los PWP dinámicamente desde `tournament_results` en lugar de usar la columna `pwp` de `profiles`. Esto garantizará consistencia con el ranking público.

---

## 2. Botón de Eliminar Usuario

### Implementación
Se agregó un botón "Eliminar" en el panel de gestión de usuarios que:

✅ **Aparece para todos los usuarios excepto admins**
✅ **Está separado visualmente** de los botones Suspender/Banear
✅ **Muestra advertencia clara** sobre la eliminación permanente
✅ **Preserva los resultados de torneos** (los desvincula pero no los elimina)

### Diferencias entre Banear y Eliminar

| Acción | Banear | Eliminar |
|--------|--------|----------|
| **Perfil del usuario** | Se mantiene, estado = 'banned' | Se elimina permanentemente |
| **Resultados de torneos** | Se mantienen vinculados | Se desvinculan (player_id = NULL) |
| **Anuncios del marketplace** | Se mantienen | Se eliminan |
| **Historial administrativo** | Se mantiene | Se elimina |
| **Reversible** | ✅ Sí (botón "Activar") | ❌ No |

### Función RPC Creada
Se creó la función `admin_delete_user` que:
- Verifica que el usuario actual sea admin
- Previene eliminar cuentas de admin
- Registra la acción en el log de auditoría
- Elimina en cascada:
  - Anuncios del marketplace
  - Favoritos
  - Notificaciones
  - Aliases de jugador
  - Registros de eventos
  - Aplicaciones (juez, creador de contenido)
- Desvincula (no elimina) los resultados de torneos
- Elimina el perfil

### Archivo SQL
[`admin_delete_user.sql`](file:///d:/The%20Player/Pagina%20ranking/ThePlayer.gg/docs/admin_delete_user.sql)

**⚠️ IMPORTANTE**: Debes ejecutar este script en Supabase SQL Editor para crear la función RPC.

---

## Próximos Pasos

1. **Ejecutar en Supabase SQL Editor**:
   ```sql
   -- 1. Crear función de eliminación
   \i admin_delete_user.sql
   
   -- 2. Recalcular PWP de todos los jugadores
   SELECT recalculate_all_players_pwp();
   ```

2. **Verificar** que los puntos de Sergio y Alexander ahora coincidan entre el panel de admin y el ranking público

3. **Probar** el botón de eliminar con una cuenta de prueba (no con cuentas reales)

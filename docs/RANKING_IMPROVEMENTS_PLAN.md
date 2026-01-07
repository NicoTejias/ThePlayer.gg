# 🎯 Plan de Mejoras del Sistema de Ranking

## 📊 Estado Actual

### ✅ Implementado:
- Función RPC `get_game_ranking(game_type)` para cálculo dinámico
- `App.tsx` actualizado para usar la RPC
- Filtrado por juego en el contexto (`GameContext`)

### ⏳ Pendiente de Verificar:
- Que la función RPC esté creada en Supabase
- Que los datos de torneos tengan `game_type` correcto
- Que el frontend muestre correctamente los rankings por juego

---

## 🔧 Mejoras Propuestas

### 1. **Optimización de Rendimiento**

#### Problema:
La función `get_game_ranking` hace un JOIN complejo que puede ser lento con muchos datos.

#### Solución:
Agregar índices en las columnas clave:

```sql
-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_tournament_results_player_id 
ON tournament_results(player_id);

CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament_id 
ON tournament_results(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournaments_game_type 
ON tournaments(game_type);

-- Índice compuesto para la query principal
CREATE INDEX IF NOT EXISTS idx_tr_player_tournament 
ON tournament_results(player_id, tournament_id);
```

**Beneficio:** Queries 5-10x más rápidas

---

### 2. **Cache de Resultados**

#### Problema:
Calcular el ranking cada vez que se carga la página es innecesario si los datos no cambian frecuentemente.

#### Solución A: Materialized View (Recomendado)
```sql
-- Crear vista materializada que se actualiza periódicamente
CREATE MATERIALIZED VIEW ranking_cache AS
SELECT 
    game_type,
    player_id,
    SUM(pwp_earned) as total_pwp,
    SUM(wins) as total_wins,
    SUM(losses) as total_losses,
    SUM(draws) as total_draws
FROM tournament_results tr
JOIN tournaments t ON tr.tournament_id = t.id
GROUP BY game_type, player_id;

-- Índice en la vista
CREATE INDEX idx_ranking_cache_game 
ON ranking_cache(game_type, total_pwp DESC);

-- Función para refrescar el cache
CREATE OR REPLACE FUNCTION refresh_ranking_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ranking_cache;
END;
$$ LANGUAGE plpgsql;

-- Actualizar automáticamente cada hora
-- (Configurar en Supabase Dashboard → Database → Cron Jobs)
```

**Beneficio:** Queries instantáneas, menor carga en la DB

#### Solución B: Cache en el Frontend
```tsx
// En App.tsx, usar React Query o SWR
import { useQuery } from '@tanstack/react-query';

const { data: players } = useQuery({
  queryKey: ['ranking', currentGame],
  queryFn: () => fetchRanking(currentGame),
  staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  cacheTime: 10 * 60 * 1000
});
```

**Beneficio:** Menos requests a Supabase, mejor UX

---

### 3. **Paginación del Ranking**

#### Problema:
Si hay 1000+ jugadores, cargar todos es lento e innecesario.

#### Solución:
```tsx
// Modificar get_game_ranking para soportar paginación
CREATE OR REPLACE FUNCTION public.get_game_ranking(
    p_game_type TEXT,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (...) AS $$
BEGIN
    RETURN QUERY
    SELECT ...
    FROM profiles p
    ...
    ORDER BY pwp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

// En el frontend
const [page, setPage] = useState(0);
const ITEMS_PER_PAGE = 50;

const { data } = await supabase.rpc('get_game_ranking', {
    p_game_type: currentGame,
    p_limit: ITEMS_PER_PAGE,
    p_offset: page * ITEMS_PER_PAGE
});
```

**Beneficio:** Carga inicial 10x más rápida

---

### 4. **Búsqueda de Jugadores**

#### Implementación:
```tsx
// Agregar campo de búsqueda en RankingsPage
const [searchTerm, setSearchTerm] = useState('');

const filteredPlayers = useMemo(() => {
    if (!searchTerm) return players;
    
    return players.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.region?.toLowerCase().includes(searchTerm.toLowerCase())
    );
}, [players, searchTerm]);

// UI
<input 
    type="text"
    placeholder="Buscar jugador..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="..."
/>
```

**Beneficio:** Mejor UX, fácil encontrar jugadores específicos

---

### 5. **Filtros Adicionales**

#### Implementación:
```tsx
// Filtros en RankingsPage
const [filters, setFilters] = useState({
    region: 'all',
    isPro: 'all',
    minPWP: 0
});

const filteredPlayers = useMemo(() => {
    return players.filter(p => {
        if (filters.region !== 'all' && p.region !== filters.region) return false;
        if (filters.isPro !== 'all' && p.is_pro !== (filters.isPro === 'true')) return false;
        if (p.pwp < filters.minPWP) return false;
        return true;
    });
}, [players, filters]);

// UI
<select onChange={(e) => setFilters({...filters, region: e.target.value})}>
    <option value="all">Todas las regiones</option>
    <option value="Santiago">Santiago</option>
    <option value="Valparaíso">Valparaíso</option>
    ...
</select>
```

**Beneficio:** Usuarios pueden ver rankings regionales, solo pros, etc.

---

### 6. **Estadísticas Adicionales**

#### Implementación:
```sql
-- Agregar más métricas a get_game_ranking
CREATE OR REPLACE FUNCTION public.get_game_ranking(p_game_type TEXT)
RETURNS TABLE (
    ...
    win_rate NUMERIC,
    tournaments_played BIGINT,
    avg_placement NUMERIC,
    best_placement INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ...
        CASE 
            WHEN SUM(tr.wins + tr.losses + tr.draws) > 0 
            THEN ROUND(SUM(tr.wins)::NUMERIC / SUM(tr.wins + tr.losses + tr.draws) * 100, 2)
            ELSE 0 
        END as win_rate,
        COUNT(DISTINCT tr.tournament_id) as tournaments_played,
        ROUND(AVG(tr.placement), 1) as avg_placement,
        MIN(tr.placement) as best_placement
    FROM profiles p
    ...
END;
$$;
```

**Beneficio:** Más información útil para los jugadores

---

### 7. **Gráficos de Progreso**

#### Implementación:
```tsx
// Usar Chart.js o Recharts
import { LineChart, Line, XAxis, YAxis } from 'recharts';

// Obtener historial de PWP del jugador
const { data: history } = await supabase
    .from('tournament_results')
    .select('created_at, pwp_earned')
    .eq('player_id', playerId)
    .order('created_at');

// Calcular PWP acumulado
const chartData = history.reduce((acc, curr, idx) => {
    const prevPWP = idx > 0 ? acc[idx - 1].pwp : 0;
    return [...acc, {
        date: curr.created_at,
        pwp: prevPWP + curr.pwp_earned
    }];
}, []);

<LineChart data={chartData}>
    <Line type="monotone" dataKey="pwp" stroke="#8884d8" />
    <XAxis dataKey="date" />
    <YAxis />
</LineChart>
```

**Beneficio:** Visualización del progreso del jugador

---

## 🎯 Plan de Implementación

### Fase 1: Crítico (Hacer Ahora)
1. ✅ Verificar que `get_game_ranking` existe
2. ⏳ Agregar índices para rendimiento
3. ⏳ Testear el ranking en el frontend

### Fase 2: Importante (Esta Semana)
4. Implementar paginación
5. Agregar búsqueda de jugadores
6. Optimizar con cache (materialized view o React Query)

### Fase 3: Nice to Have (Este Mes)
7. Filtros adicionales (región, pro, etc.)
8. Estadísticas avanzadas (win rate, avg placement)
9. Gráficos de progreso

---

## 📊 Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Tiempo de carga ranking | ? | < 500ms |
| Jugadores mostrados | Todos | Top 100 + paginación |
| Búsqueda | No | Sí |
| Filtros | Solo juego | Juego + región + pro |
| Estadísticas | Básicas | Avanzadas |

---

**Próximos pasos:**
1. Ejecutar `VERIFY_DYNAMIC_RANKING.sql` en Supabase
2. Reportar resultados
3. Implementar mejoras según prioridad

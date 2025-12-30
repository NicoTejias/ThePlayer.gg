# 🗺️ Roadmap de Lanzamiento y Consolidación PLS

Este documento rastrea la transición de la plataforma ThePlayer.gg de fase de desarrollo a producción, incluyendo limpieza de datos, implementación de reglas de negocio y material de soporte.

## 🔴 FASE 1: Limpieza de Datos y Preparación DB (INMEDIATO)
*Objetivo: Eliminar datos de prueba y "lorem ipsum" para tener un sitio listo para producción.*

- [ ] **Auditoría de Frontend**
    - [ ] Revisar HomePage (eliminar `mockEvents`, `mockArticles`).
    - [ ] Revisar RankingsPage (asegurar que data venga 100% de DB).
    - [ ] Revisar Marketplace (eliminar items de prueba).
    - [ ] Revisar Sidebar/Navegación (textos finales).
- [ ] **Limpieza de Base de Datos (Supabase)**
    - [ ] Eliminar torneos de prueba ("Test Tournament", etc.).
    - [ ] Eliminar usuarios "bot" o de prueba (mantener admins y cuentas reales).
    - [ ] Resetear tablas de `tournament_registrations` si tienen basura.
- [ ] **Carga Inicial de Datos (Seed)**
    - [ ] Cargar lista real de Tiendas iniciales.
    - [ ] Cargar primer artículo real de "Bienvenida a la PLS".

## 🟠 FASE 2: Lógica de Temporadas y Puntos
*Objetivo: Implementar la regla del 50% de carry-over y gestión de temporadas.*

- [ ] **Lógica de Base de Datos**
    - [ ] Crear tabla `season_history` (para guardar los puntos antes del reset).
    - [ ] Crear función SQL `reset_season_points()`:
        *   `UPDATE profiles SET pwp = floor(pwp * 0.5)`
    - [ ] Crear UI para Admin para ejecutar el "Cierre de Temporada".
- [ ] **Comunicación al Usuario**
    - [ ] Crear página/modal "Reglas de Temporada" explicando el reset del 50%.
    - [ ] Añadir tooltips en el Ranking explicando la mecánica.

## 🟡 FASE 3: Gala y Sistema de Premios
*Objetivo: Gamificación y reconocimiento anual.*

- [ ] **Definición de Premios**
    - [ ] Diseñar categorías (Jugador del Año, Mejor Winrate, Tienda Destacada, Juez del Año, etc.).
- [ ] **Desarrollo Técnico**
    - [ ] Crear tabla `awards` (id, name, description, icon).
    - [ ] Crear tabla `user_awards` (user_id, award_id, season, date).
    - [ ] Crear componente `TrophyCase` en el perfil de usuario.

## 🟢 FASE 4: Documentación y Material de Soporte
*Objetivo: Educar y vender la plataforma.*

- [ ] **Manuales de Usuario**
    - [ ] **Perfil Jugador:** Guía de registro y uso.
    - [ ] **Perfil Tienda:** Guía de gestión de torneos y subida de datos.
    - [ ] **Perfil Juez:** Guía de herramientas.
- [ ] **Material de Marketing (Tiendas)**
    - [ ] **Presentación (PPT/PDF):** Propuesta de valor para dueños de tienda.
    - [ ] **Tríptico PLS:** Diseño para imprimir explicando qué es la liga.

## 🔵 FASE 5: Pulido Final y UI/UX
- [ ] Ajustar textos legales (Términos y Condiciones).
- [ ] Verificar todos los enlaces rotos.
- [ ] Optimización de carga (imágenes, scripts).

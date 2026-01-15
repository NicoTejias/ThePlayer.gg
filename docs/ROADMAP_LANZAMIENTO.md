# 🗺️ Roadmap de Lanzamiento y Consolidación PLS

Este documento rastrea la transición de la plataforma ThePlayer.gg de fase de desarrollo a producción, incluyendo limpieza de datos, implementación de reglas de negocio y material de soporte.

## 🟢 FASE 1: Limpieza de Datos y Preparación DB (COMPLETADO)
*Objetivo: Eliminar datos de prueba y "lorem ipsum" para tener un sitio listo para producción.*

- [x] **Auditoría de Frontend**
    - [x] Revisar HomePage (eliminar `mockEvents`, `mockArticles`).
    - [x] Revisar RankingsPage (asegurar que data venga 100% de DB).
    - [x] Revisar Marketplace (eliminar items de prueba).
    - [x] Revisar Sidebar/Navegación (textos finales).
- [x] **Limpieza de Base de Datos (Supabase)**
    - [x] Eliminar torneos de prueba.
    - [x] Eliminar usuarios "bot" o de prueba.
- [x] **Carga Inicial de Datos (Seed)**
    - [x] Cargar lista real de Tiendas iniciales.
    - [x] Cargar primer artículo real de "Bienvenida a la PLS".

## 🟢 FASE 2: Lógica de Temporadas y Puntos (COMPLETADO)
*Objetivo: Implementar la regla del 50% de carry-over y gestión de temporadas.*

- [x] **Lógica de Base de Datos**
    - [x] Crear tabla `season_history`.
    - [x] Crear función SQL `execute_season_reset()` y `preview_season_reset()`.
    - [x] Crear UI para Admin para ejecutar el "Cierre de Temporada".
- [x] **Comunicación al Usuario**
    - [x] Crear página especial de Salón de la Fama.
    - [x] Añadir Level Badge en el Ranking explicando la mecánica.

## 🟢 FASE 3: Gala y Sistema de Premios (COMPLETADO)
*Objetivo: Gamificación y reconocimiento anual.*

- [x] **Definición de Premios**
    - [x] Diseñar categorías (Jugador del Año, Gala 2026, etc.).
- [x] **Desarrollo Técnico**
    - [x] Crear sistema de niveles por XP (PWP).
    - [x] Implementar logros automáticos y manuales.
    - [x] Crear componente `TrophyCase` y `LevelProgressBar`.
    - [x] Sistema de nominados para la Gala 2026.

## 🟢 FASE 4: Documentación y Material de Soporte (COMPLETADO)
*Objetivo: Educar y vender la plataforma.*

- [x] **Manuales de Usuario**
    - [x] **Perfil Jugador:** Guía de registro y uso (en SupportPage).
    - [x] **Perfil Tienda:** Guía de gestión de torneos (en SupportPage).
    - [x] **Perfil Juez:** Guía de herramientas (en SupportPage).
- [x] **Material de Marketing (Tiendas)**
    - [x] **Propuesta de Valor:** Integrada en `/tiendas` y `/soporte`.

## 🟢 FASE 5: Pulido Final y UI/UX (COMPLETADO)
- [x] Ajustar textos legales (Términos y Condiciones).
- [x] Verificar todos los enlaces rotos.
- [x] Optimización de carga (imágenes, scripts, lazy loading).
- [x] Implementación de Página 404 personalizada.
- [x] Auditoría SEO (Index, Sitemap, Robots.txt).

# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [2.0.0] - 2025-12-29

### 🎉 Major Release - Complete Platform Overhaul

Esta versión representa una renovación completa de la plataforma con 14 fases de mejoras implementadas.

### ✨ Added

#### Personalización por Rol
- **Role-Based Widgets**: Widgets personalizados para cada tipo de usuario
  - VisitorWidget: Value proposition y CTAs para visitantes
  - PlayerWidget: Estadísticas y próximos eventos para jugadores
  - StoreWidget: Panel de control para tiendas
  - JudgeWidget: Asignaciones y casos para jueces
  - AdminWidget: Métricas y acciones rápidas para administradores

#### Mejoras de Conversión (CTAs)
- **FloatingActionButton**: Botón flotante "Crear Torneo" para tiendas
- **QuickRegistrationModal**: Modal de registro rápido a eventos
- **Botones de inscripción**: En cards de eventos con estado "Inscrito ✓"
- **CTA contextual en Header**: Botón que cambia según el rol del usuario

#### Mejoras en Rankings
- **Badge "Tú"**: Identificación visual de la posición del jugador
- **Highlighting**: Fila destacada con borde y fondo para el jugador actual
- **Mostrar posición**: Visualización de posición si no está en top 5
- **CTA motivacional**: "¿Quieres subir en el ranking?" con link a eventos

#### Mejoras en Cards de Media
- **Hover effects mejorados**: Shadow, translate, border glow
- **Botones de acción**: "📖 Leer Ahora" y "▶️ Ver Video" en hover
- **Indicador de tiempo**: Tiempo de lectura para artículos
- **Duración de video**: Badge con duración en videos
- **Badges de categoría**: Tipo de contenido visible
- **Preview mejorado**: Autor, fecha y excerpt

#### Animaciones y Polish
- **5 animaciones CSS custom**:
  - `animate-float`: Efecto flotante (3s)
  - `animate-pulse-glow`: Resplandor pulsante (2.5s)
  - `animate-shimmer`: Efecto brillo (2s)
  - `animate-fade-in-up`: Fade-in con movimiento (0.6s)
  - `skeleton-pulse`: Pulso para loaders (1.5s)
- **Skeleton Loaders**: 5 componentes para estados de carga
  - EventCardSkeleton
  - RankingRowSkeleton
  - StatCardSkeleton
  - ArticleCardSkeleton
  - VideoCardSkeleton

#### SEO y Performance
- **Meta tags completos**: Title, description, keywords, author
- **Open Graph tags**: Para compartir en Facebook/WhatsApp
- **Twitter Cards**: Preview optimizado para Twitter
- **Structured Data (JSON-LD)**: Organization y WebSite schemas
- **robots.txt**: Configuración para crawlers
- **sitemap.xml**: 8 páginas principales indexadas
- **Preload crítico**: Logo y recursos importantes
- **Preconnect**: Google Fonts optimizado

### 🔧 Changed

#### Optimización Móvil
- **Carousel responsivo**: 300px móvil, 350px sm, 400px md
- **Stats grid**: 2 columnas en móvil (antes 4)
- **Touch targets**: Mínimo 44px en botones
- **Widgets responsivos**: Stack vertical en móvil
- **FAB optimizado**: Más pequeño, solo icono en móvil
- **Logo responsivo**: h-8 móvil, h-10 sm, h-12 md
- **Media cards**: 1 columna en móvil

#### UI/UX Improvements
- **Logo reubicado**: Ahora en lado izquierdo del header
- **Selector de mundos**: Movido al lado derecho
- **Submenú Magic**: Arreglado para permanecer abierto
- **Footer limpio**: Removido "The Player" de partners
- **Carousel height**: Reducido de 500px a 400px

### 🐛 Fixed
- **TypeScript errors**: Corregidos todos los errores de tipos
- **Hover states**: Mejorados en todos los componentes
- **Mobile layout**: Arreglados problemas de responsive
- **Image loading**: Optimizado con lazy loading
- **Console errors**: 0 errores en producción

### 📚 Documentation
- **README.md**: Documentación completa y profesional
- **CHANGELOG.md**: Historial de cambios detallado
- **Testing Report**: Reporte de testing manual completo
- **Walkthroughs**: Documentación de cada fase implementada

### 🎨 Style
- **Tailwind CSS**: Estilos consistentes y mantenibles
- **Dark theme**: Tema oscuro profesional
- **Micro-animations**: Transiciones suaves y elegantes
- **Premium UX**: Diseño pulido y moderno

### ⚡ Performance
- **Lazy loading**: Imágenes cargadas bajo demanda
- **Code splitting**: Optimización de bundle
- **Preconnect**: Conexiones anticipadas
- **Optimized fonts**: Google Fonts con display=swap

## [1.0.0] - 2025-12-XX

### Initial Release

#### Features
- Sistema de rankings (PWP y Win Rate)
- Gestión de torneos
- Directorio de tiendas
- Sistema de jueces
- Marketplace
- CMS para contenido
- Sistema de disciplina
- Autenticación con Supabase

---

## Tipos de Cambios

- `Added` - Nuevas funcionalidades
- `Changed` - Cambios en funcionalidades existentes
- `Deprecated` - Funcionalidades que serán removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Corrección de bugs
- `Security` - Cambios de seguridad

## Versionado

Este proyecto usa [Semantic Versioning](https://semver.org/):
- **MAJOR** version cuando hay cambios incompatibles en la API
- **MINOR** version cuando se añaden funcionalidades compatibles
- **PATCH** version cuando se corrigen bugs compatibles

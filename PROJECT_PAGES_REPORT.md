# Informe de Estructura y Estación de Trabajo: ThePlayer.gg

Este documento detalla todas las páginas existentes en el proyecto **ThePlayer.gg**, describiendo su propósito, contenido y las funcionalidades disponibles en cada una para los distintos tipos de usuarios (Jugadores, Tiendas, Administradores).

---

## 1. Inicio (HomePage)
Es la puerta de entrada a la plataforma. Diseñada para dar una visión rápida del estado de la comunidad.
*   **Contenido:**
    *   Carrusel principal con noticias destacadas, accesos a PLS y Salón de la Fama.
    *   Widgets personalizados según el rol (Jugador ve sus stats rápidas, Tienda ve sus próximos eventos, Admin ve alertas).
    *   Resumen estadístico de la comunidad (total jugadores, tiendas, torneos).
    *   Sección de "Próximos Eventos" con tarjetas de inscripción rápida.
    *   Vista previa de los Top 10 del Ranking (Player Points).
    *   Feed de últimas noticias y videos destacados.
*   **Funcionalidades:**
    *   Inscripción rápida a torneos futuros.
    *   Navegación directa a secciones principales.
    *   Visualización de estado "En Vivo" (si hay stream activo).

## 2. Player Latam Series (PLSPage)
Página dedicada al circuito competitivo principal.
*   **Contenido:**
    *   Explicación detallada de qué es la PLS.
    *   Estructura de premios y clasificación.
    *   Calculadora visual de puntos o explicación del sistema de multiplicadores.
*   **Funcionalidades:**
    *   Información sobre cómo clasificar a la Gran Final.
    *   Desglose de Puntos por Victoria/Empate según nivel del torneo.

## 3. Rankings Oficiales (RankingsPage)
El corazón competitivo de la plataforma.
*   **Contenido:**
    *   **Tablas de Clasificación:** Filtrables por temporada (2024, 2025, 2026).
    *   **Ranking Individual (Player Points):** Lista completa de jugadores ordenada por puntos acumulados.
    *   **Copa de Comunidades:** Ranking de equipos/tiendas sumando los puntos de sus miembros.
*   **Funcionalidades:**
    *   Visualización de medallas (Pro, Creador, Nivel).
    *   Filtros por Temporada.
    *   Enlaces directos a perfiles de jugadores y equipos.

## 4. Calendario de Eventos (EventsPage)
Herramienta central para que los jugadores encuentren dónde jugar.
*   **Contenido:**
    *   **Calendario Visual:** Vista mensual/semanal de eventos programados.
    *   **Listado de Próximos Eventos:** Tarjetas detalladas con fecha, hora, formato, tienda y cupos.
    *   **Historial:** Tabla de torneos ya finalizados.
*   **Funcionalidades:**
    *   **Inscripción:** Los jugadores pueden inscribirse (pre-registro) a los eventos.
    *   **Filtrado:** Buscar por formato, tienda o ciudad.

## 5. Resultados de Torneos (TournamentsListPage / Standings)
Archivo histórico de la competencia.
*   **Contenido:**
    *   Lista cronológica de todos los torneos reportados.
    *   Vista de detalle (`TournamentStandingsPage`) con las posiciones finales, rondas y estadísticas de un torneo específico.
*   **Funcionalidades:**
    *   Revisión de meta-juego (qué mazos ganaron, si la data está disponible).
    *   Verificación de puntos otorgados por torneo.

## 6. Mercado TCG (MarketplacePage)
Plataforma de compra/venta entre usuarios.
*   **Contenido:**
    *   Listado de cartas y productos sellados publicados por usuarios.
    *   Filtros por juego, condición, precio y ubicación.
    *   Página de detalle de producto (`MarketplaceDetailPage`).
*   **Funcionalidades:**
    *   **Publicar Anuncio:** Usuarios pueden subir sus cartas para la venta.
    *   **Contactar:** Botones para contactar al vendedor (WhatsApp/Mensaje).
    *   **Mis Anuncios:** Gestión de publicaciones propias (`MyListingsPage`).

## 7. Tiendas Oficiales (StoresPage)
Directorio de tiendas asociadas.
*   **Contenido:**
    *   Mapa o lista de tiendas registradas en ThePlayer.gg.
    *   Perros de perfil de cada tienda con su dirección, horarios y próximos eventos.
*   **Funcionalidades:**
    *   Búsqueda de tiendas cercanas.
    *   Ver perfil público de la tienda.

## 8. Hub de Contenido (ContentPage)
Central de creadores y media.
*   **Contenido:**
    *   Directorio de Creadores de Contenido asociados.
    *   Feed de Artículos (`MediaArticlesPage`) y Videos (`MediaVideosPage`).
    *   Página de detalle de artículos (`ArticleDetailPage`) tipo blog.
*   **Funcionalidades:**
    *   Postulación para nuevos creadores (`ContentCreatorApplicationPage`).
    *   Lectura de artículos y reproducción de videos.

## 9. Foro de la Comunidad (Forum)
Espacio de discusión (en desarrollo/beta).
*   **Contenido:**
    *   Categorías de discusión (Estrategia, Off-topic, Dudas de reglas).
    *   Hilos y posts de usuarios.
*   **Funcionalidades:**
    *   Crear hilos de discusión.
    *   Responder a temas.

## 10. Perfil de Jugador (PlayerDashboardPage)
El espacio personal de cada usuario.
*   **Contenido:**
    *   **Resumen:** Nivel actual, Player Points, Rango.
    *   **Billetera Digital:** ThePlayer Card visual.
    *   **Historial:** Lista de todos los torneos jugados y sus resultados.
    *   **Medallas:** Logros desbloqueados (Trofeos).
    *   **Estadísticas Avanzadas:** Gráficos de rendimiento (`PlayerStatsPage`).
*   **Funcionalidades:**
    *   Editar perfil (avatar, biografía).
    *   Gestionar equipo/comunidad.
    *   Ver estado de inscripciones.

## 11. Panel de Tienda (StoreDashboardPage)
Herramienta de gestión para dueños de tiendas (TOs).
*   **Contenido:**
    *   Métricas de la tienda (jugadores únicos, retención).
    *   Gestión de Ligas (`StoreLeagues`).
    *   Inventario (si aplica).
*   **Funcionalidades:**
    *   **Crear Evento:** Agendar torneos en el calendario.
    *   **Reportar Torneo:** Subir resultados (XML/JSON de EventLink o manual) para asignar puntos.
    *   **Gestionar Inventario:** Subir productos al marketplace de la tienda.
    *   **Validar Inscripciones:** Ver lista de inscritos a sus eventos.

## 12. Panel de Administración (AdminDashboardPage)
Centro de control para el staff de ThePlayer.gg.
*   **Contenido:**
    *   Visión global del sistema (Usuarios totales, reportes de error).
    *   Listas de aprobación (Tiendas pendientes, Solicitudes de creador).
*   **Funcionalidades:**
    *   Aprobar/Banear usuarios y tiendas.
    *   Gestionar CMS (Noticias, Sliders).
    *   Revisar reportes de conducta.
    *   Otorgar medallas especiales.

## 13. Formatos Específicos (Commander, Pauper, Premodern)
Páginas "landing" para formatos populares de Magic.
*   **Contenido:**
    *   Información específica del formato.
    *   Rankings filtrados solo para ese formato.
    *   Reglas especiales de la comunidad (ej: Blacklist de Commander 500).

## 14. Páginas Institucionales
*   **Quiénes Somos (AboutPage):** Misión, visión y equipo.
*   **Reglamento (ReglamentoPage):** Reglas de conducta y competencia.
*   **Salón de la Fama (HallOfFamePage):** Histórico de ganadores de temporadas pasadas.
*   **Soporte (SupportPage):** Formulario de contacto y preguntas frecuentes.
*   **Términos y Condiciones (TermsPage):** Legales.

## 15. Autenticación y Cuenta
*   **Login/Registro (AuthPage):** Entrada al sistema (pública).
*   **Configuración (SettingsPage):** Cambio de contraseña, preferencias de notificaciones, privacidad.
*   **Recuperar Contraseña:** Flujo de `ForgotPasswordPage` y `ResetPasswordPage`.

---
*Documento generado automáticamente por el Asistente Técnico de ThePlayer.gg*

# Backlog de Sprints y Tareas: ThePlayer.gg

Este backlog organiza el desarrollo de software y tareas operativas en sprints de 2 semanas de duración.

---

## 🎯 Sprint 1 (Actual): Depuración del Core y Enfoque
*   **Meta:** Eliminar el Marketplace completo para simplificar la plataforma y asegurar la estabilidad de la compilación.
*   **Tareas:**
    1.  **[FRONTEND]** Remover rutas e imports del Marketplace en [App.tsx](file:///c:/Users/nicol/Desktop/Proyectos/ThePlayergg/ThePlayer.gg/App.tsx).
    2.  **[FRONTEND]** Limpiar menú de administración en [AdminDashboardPage.tsx](file:///c:/Users/nicol/Desktop/Proyectos/ThePlayergg/ThePlayer.gg/pages/AdminDashboardPage.tsx).
    3.  **[FRONTEND]** Desconectar/Deshabilitar páginas y componentes obsoletos del mercado (`MarketplacePage`, `MarketplaceDetailPage`, `MyListingsPage`, `CreateListingModal`).
    4.  **[DEVOPS]** Ejecutar compilación de validación (`npm run build`) para verificar la ausencia de errores de tipos.

---

## 🚀 Sprint 2: Optimización de Rankings y Carga de Eventos
*   **Meta:** Asegurar que la subida de torneos a través de archivos y el cálculo de la tabla de posiciones sea rápida y libre de fricciones.
*   **Tareas:**
    1.  **[BACKEND]** Revisar y optimizar funciones RPC en PostgreSQL para el procesamiento masivo de resultados (`process_tournament_results_bulk`).
    2.  **[FRONTEND]** Mejorar el parser de archivos PDF/CSV en el panel de carga de torneos de tiendas, agregando validaciones de formato de nombres y victorias.
    3.  **[DATABASE]** Indexar tablas clave como `tournament_results` y `player_profiles` para acelerar el ordenamiento de los rankings por temporada.

---

## 💳 Sprint 3: Modelo de Suscripción para Tiendas (Monetización)
*   **Meta:** Lanzar el sistema de pagos integrado para que las tiendas puedan suscribirse mensualmente.
*   **Tareas:**
    1.  **[DATABASE]** Crear tabla `store_subscriptions` en Supabase para almacenar estado (active, trialing, canceled) e identificadores del cliente.
    2.  **[BACKEND]** Crear Edge Function en Supabase para gestionar webhooks de pagos (Stripe / Webpay / MercadoPago).
    3.  **[FRONTEND]** Implementar la vista de planes de precios en `/premium` y el botón de redirección al Checkout.
    4.  **[FRONTEND]** Modificar el flujo de carga de torneos: validar que la tienda tenga una suscripción activa antes de permitir la publicación de nuevos eventos.

---

## 🌎 Sprint 4: Internacionalización (i18n) e Idioma Portugués
*   **Meta:** Preparar la aplicación para su lanzamiento comercial en Brasil y el resto de Latinoamérica.
*   **Tareas:**
    1.  **[FRONTEND]** Migrar todos los textos fijos en vistas claves (Home, Rankings, Eventos, Configuración) al diccionario de traducciones en `context/LanguageContext.tsx`.
    2.  **[FRONTEND]** Completar diccionario de traducciones para el idioma Portugués (`pt`).
    3.  **[DATABASE]** Agregar columna `country` a perfiles de jugadores y tiendas para filtrar rankings a nivel local o regional.

# Plan Financiero y de Inversión: ThePlayer.gg

Este documento delinea los costos operativos estimados, la estructura del modelo de ingresos y la priorización de inversiones aprobada.

---

## 1. Estructura de Costos Estimada (Mensual)

A medida que el proyecto crezca en Chile y posteriormente en Latinoamérica, la infraestructura deberá escalar. Aquí se detalla la distribución proyectada del dinero:

| Concepto | Fase Inicial (Chile) | Fase de Expansión (LatAm) | Prioridad |
| :--- | :--- | :--- | :--- |
| **Bases de Datos y Backend (Supabase Pay-as-you-go)** | $25 USD | $120+ USD | Alta (Crítica) |
| **Hosting y Dominios (Vercel Pro + Dominios)** | $20 USD | $60 USD | Media |
| **Pasarela de Pagos (Comisión Stripe/Webpay)** | Variable (~3%) | Variable (~3%) | Media |
| **Campañas de Marketing / Redes Sociales** | $150 USD | $500+ USD | Alta (Crecimiento) |
| **Soporte y Operación** | Ad-hoc | $200 USD | Baja |

> [!TIP]
> **Optimización técnica:** Para mantener el costo de Supabase bajo control, se debe implementar una estrategia estricta de indexación de base de datos y evitar consultas complejas en tiempo de ejecución de rankings recurriendo a vistas materializadas o cómputo asíncrono.

---

## 2. Modelo de Ingresos: Suscripción de Tiendas

Para generar flujos de caja predecibles que sostengan la plataforma y financien las actividades, se establece un modelo de **Suscripción Mensual para Tiendas**:

### Plan Básico (Tienda Asociada)
*   **Costo Estimado:** $15.000 CLP / mes (~$16 USD)
*   **Beneficios:**
    *   Habilitación para subir y gestionar torneos y ligas (máximo 4 eventos al mes).
    *   Los torneos suman puntos estándar al ranking oficial de ThePlayer.
    *   Aparecer en el mapa y directorio público de tiendas.

### Plan Pro (Tienda Partner)
*   **Costo Estimado:** $35.000 CLP / mes (~$38 USD)
*   **Beneficios:**
    *   Creación ilimitada de eventos, torneos y ligas.
    *   Los torneos otorgan multiplicador de puntaje para los rankings de los jugadores.
    *   Sección de anuncios destacados y notificaciones automáticas para jugadores locales cuando se cree un evento.
    *   Estadísticas avanzadas de asistencia y retención de jugadores en su tienda.

---

## 3. Priorización del Presupuesto de Inversión

Todo el presupuesto disponible de inversión inicial se concentrará estrictamente en dos áreas:

1.  **Estabilidad de Infraestructura:** Asegurar que el cálculo de puntos y la subida de torneos a través de archivos de software nunca falle.
2.  **Marketing de Adquisición:** Apoyar a Hugo Castro en la creación de material publicitario digital y eventos piloto patrocinados en regiones estratégicas fuera de Santiago de Chile para acelerar la adopción de la suscripción.

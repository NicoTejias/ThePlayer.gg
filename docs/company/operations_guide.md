# Guía de Operaciones y Soporte: ThePlayer.gg

Este manual establece los flujos operativos estándar para la administración de la plataforma y soporte a usuarios.

---

## 1. Proceso de Verificación de Tiendas
Para garantizar la integridad competitiva de los rankings, solo las tiendas verificadas pueden subir resultados de torneos que sumen puntos oficiales (Player Points).

### Flujo de Verificación:
1.  **Registro:** La tienda se registra en la plataforma con el rol de `store`.
2.  **Contacto Comercial:** Hugo Castro contacta a la tienda para validar su existencia física o e-commerce activo, además de presentar los planes de suscripción.
3.  **Habilitación:** Tras el pago de la suscripción, un administrador activa el estado de la tienda en Supabase (`status = 'verified'`).
4.  **Soporte Técnico:** Nicolás Tejías asiste a la tienda en caso de problemas iniciales para configurar su perfil o subir sus torneos.

---

## 2. Validación de Resultados y Rankings
El cálculo de puntos de ranking se basa en los torneos reportados. Para evitar adulteraciones en los rankings nacionales:

*   **Límites de Tiempo:** Las tiendas deben reportar los resultados de sus torneos dentro de un plazo máximo de 7 días tras la finalización del evento.
*   **Auditoría de Inconsistencias:** El sistema marcará automáticamente para revisión (Admin Review) torneos donde:
    *   La cantidad de jugadores reportados no coincida con el aforo de la tienda.
    *   Un mismo jugador obtenga victorias perfectas en múltiples torneos simultáneos en tiendas distintas.
*   **Apelaciones de Jugadores:** Si un jugador detecta que un resultado de torneo fue cargado erróneamente, puede abrir un caso de reclamo desde su panel.

---

## 3. Coordinación y Certificación de Jueces TCG
Los jueces certificados actúan como moderadores de la comunidad competitiva.

*   **Niveles de Certificación:** Se administran 3 niveles de certificación en base a conocimientos de las reglas del juego.
*   **Reportes de Disciplina:** Los jueces utilizan el módulo de disciplina para registrar amonestaciones oficiales, descalificaciones o reportes de conducta antideportiva.
*   **Foro Privado de Jueces:** Espacio exclusivo dentro del foro para discutir dudas sobre las reglas oficiales y coordinar la logística de grandes eventos de TCG nacionales.

---

## 4. Canales de Soporte
*   **General:** Consultas de cuentas, bugs y errores técnicos son dirigidos a `contacto@theplayer.cl` y gestionados por Nicolás.
*   **Comercial:** Alianzas, suscripción de tiendas y patrocinios de marcas son atendidos por Hugo Castro.

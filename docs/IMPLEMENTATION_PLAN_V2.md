# 🚀 Plan de Implementación Maestro v2.1 - ThePlayer.gg

Actualizado según feedback del usuario: Se elimina sistema de jueces (cubierto por Wizards) y se prioriza cierre de funcionalidades de Marketplace y Administración.

## 🟢 ESTADO: FUNCIONANDO / LISTO
- [x] **Marketplace (Visualización y Creación)**: Ya se pueden ver y subir anuncios.
- [x] **Puntos PWP**: Recálculo manual listo (script `RECALCULATE_PWP.sql`).

## 🟡 PRIORIDAD 1: Completar Marketplace (Comunicación)
*Objetivo: Que los usuarios puedan cerrar tratos.*

- [ ] **Sistema de Contacto**
    - [ ] Agregar campo "Teléfono/WhatsApp" en el perfil de usuario (opcional).
    - [ ] En el detalle del anuncio, mostrar botón "Contactar por WhatsApp" o "Enviar Correo".
- [ ] **Gestión de Anuncios**
    - [ ] Implementar botón "Eliminar" para el dueño del anuncio.
    - [ ] Implementar botón "Marcar Vendido".

## 🟠 PRIORIDAD 2: Administración y Seguridad
*Objetivo: Herramientas para moderar la plataforma.*

- [ ] **Eliminar Usuario**
    - [ ] Ejecutar script final `admin_delete_user.sql` en Supabase.
    - [ ] Verificar funcionamiento en panel admin.

## 🔵 PRIORIDAD 3: Gamificación (Temporadas)
*Objetivo: Mantener la competitividad.*

- [ ] **Reinicio de Temporada**
    - [ ] Definir fecha de cierre.
    - [ ] Implementar script de "Carry-Over" (mantener 50% de puntos).

## 🟣 DESCARTADO / NO NECESARIO POR AHORA
- [x] ~~Sistema de Jueces~~: Wizards of the Coast gestionará esto externamente.

---

## 📅 Próximo Paso Sugerido

Implementar el **Botón de Contacto** en el Marketplace, ya que es lo único crítico que falta para que sea útil de verdad.

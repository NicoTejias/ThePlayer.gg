# ThePlayer.gg 🎮

> Plataforma oficial de rankings y torneos de Trading Card Games en Chile

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4.1-646cff.svg)](https://vitejs.dev/)

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Deployment](#-deployment)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

## 🎯 Descripción

**ThePlayer.gg** es la plataforma líder de Trading Card Games (TCG) en Chile, ofreciendo:

- 🏆 **Rankings Oficiales** - Sistema de Player Points y estadísticas avanzadas
- 📅 **Gestión de Torneos** - Creación y administración de eventos
- 🏪 **Directorio de Tiendas** - Encuentra tiendas TCG cerca de ti
- ⚖️ **Sistema de Jueces** - Certificación y asignación de jueces
- 📰 **Contenido Multimedia** - Artículos y videos de la comunidad
- 🛒 **Marketplace** - Compra y venta de cartas

### Juegos Soportados

- Magic: The Gathering
- Pokémon TCG
- Yu-Gi-Oh!
- One Piece Card Game
- Lorcana
- Star Wars Unlimited
- Flesh and Blood
- Digimon

## ✨ Características

### Para Jugadores
- ✅ Perfil personalizado con estadísticas
- ✅ Registro rápido a torneos
- ✅ Historial de partidas y resultados
- ✅ Rankings en tiempo real
- ✅ Notificaciones de eventos cercanos

### Para Tiendas
- ✅ Creación de torneos con un click
- ✅ Gestión de inscripciones
- ✅ Reportes de resultados
- ✅ Estadísticas de asistencia
- ✅ Perfil público con ubicación

### Para Jueces
- ✅ Sistema de certificación por niveles
- ✅ Asignación a torneos
- ✅ Gestión de casos disciplinarios
- ✅ Foro privado de jueces
- ✅ Directorio público

### Para Administradores
- ✅ Panel de control completo
- ✅ Gestión de contenido (CMS)
- ✅ Moderación de marketplace
- ✅ Aprobación de tiendas
- ✅ Analytics y métricas

## 🛠 Tecnologías

### Frontend
- **React 19.2.0** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions
  - Storage
  - Row Level Security (RLS)

### Servicios Externos
- **YouTube API** - Videos embebidos
- **OpenStreetMap** - Mapas de tiendas

## 📦 Instalación

### Prerequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/theplayer.gg.git
cd theplayer.gg
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Ejecutar migraciones de base de datos**

Ejecutar los siguientes scripts SQL en tu proyecto de Supabase (en orden):

```bash
# 1. Sistema de disciplina
docs/DISCIPLINE_SYSTEM_DB.sql
docs/DISCIPLINE_SYSTEM_V2.sql

# 2. Sistema de contenidos
docs/CMS_SYSTEM_DB.sql

# 3. Fix marketplace (si es necesario)
docs/FIX_MARKETPLACE_GAME_TYPE.sql
```

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`

## ⚙️ Configuración

### Supabase Setup

1. **Crear proyecto en Supabase**
   - Ir a [supabase.com](https://supabase.com)
   - Crear nuevo proyecto
   - Copiar URL y anon key

2. **Configurar Authentication**
   - Habilitar Email/Password
   - Habilitar Google OAuth (opcional)
   - Configurar redirect URLs

3. **Configurar Storage**
   - Crear bucket `marketplace-images`
   - Configurar políticas públicas de lectura

4. **Ejecutar Migraciones**
   - Usar SQL Editor en Supabase Dashboard
   - Ejecutar scripts en orden

## 🚀 Uso

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview build de producción
npm run preview

# Linting
npm run lint
```

### Roles de Usuario

La aplicación soporta 5 roles:

1. **Visitor** - Usuario no autenticado
2. **Player** - Jugador registrado
3. **Store** - Tienda verificada
4. **Judge** - Juez certificado
5. **Admin** - Administrador del sistema

### Flujos Principales

#### Registro de Jugador
1. Click en "Registrarse"
2. Completar formulario (nombre, email, región, DCI)
3. Verificar email
4. Completar perfil

#### Crear Torneo (Tienda)
1. Login como tienda
2. Click en FAB "Crear Torneo"
3. Completar detalles del torneo
4. Publicar

#### Inscribirse a Torneo (Jugador)
1. Ver evento en homepage o página de eventos
2. Click en "Inscribirse"
3. Confirmar inscripción
4. Recibir confirmación

## 📁 Estructura del Proyecto

```
theplayer.gg/
├── public/
│   ├── images/           # Imágenes estáticas
│   ├── robots.txt        # SEO
│   └── sitemap.xml       # SEO
├── src/
│   ├── components/       # Componentes React
│   │   ├── widgets/      # Widgets por rol
│   │   ├── modals/       # Modales
│   │   └── ...
│   ├── pages/            # Páginas principales
│   ├── contexts/         # React Contexts
│   ├── types/            # TypeScript types
│   └── utils/            # Utilidades
├── docs/                 # Scripts SQL y documentación
├── index.html            # HTML principal
├── index.css             # Estilos globales
├── App.tsx               # Componente raíz
└── package.json
```

### Componentes Clave

- **Header.tsx** - Navegación principal
- **HomePage.tsx** - Página de inicio con widgets por rol
- **RankingsPage.tsx** - Sistema de Player Points por temporada
- **EventsPage.tsx** - Listado de torneos
- **StoresPage.tsx** - Directorio de tiendas
- **JudgesPage.tsx** - Sistema de jueces
- **MarketplacePage.tsx** - Compra/venta de cartas

## 🌐 Deployment

### Vercel (Recomendado)

1. **Conectar repositorio**
```bash
vercel
```

2. **Configurar variables de entorno**
   - Agregar `VITE_SUPABASE_URL`
   - Agregar `VITE_SUPABASE_ANON_KEY`

3. **Deploy**
```bash
vercel --prod
```

### Netlify

1. **Build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment variables**
   - Agregar variables de Supabase

3. **Deploy**

### Variables de Entorno Requeridas

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crear branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Guías de Estilo

- **TypeScript**: Usar tipos estrictos
- **React**: Componentes funcionales con hooks
- **CSS**: Tailwind CSS utility classes
- **Commits**: Conventional Commits

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 👥 Equipo

**ThePlayer.gg** - Corporación TCG Chile

- Website: [theplayer.gg](https://theplayer.gg)
- YouTube: [@theplayergg](https://www.youtube.com/@theplayergg)
- Instagram: [@theplayer.gg](https://www.instagram.com/theplayer.gg)

## 🙏 Agradecimientos

- Comunidad TCG de Chile
- Tiendas asociadas
- Jueces certificados
- Todos los jugadores

---

**Hecho con ❤️ para la comunidad TCG de Chile** 🇨🇱

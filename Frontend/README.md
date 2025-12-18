# Frontend - Sistema de Gestión de Feedback

## 🚀 Inicio Rápido

### Instalación
```bash
npm install
```

### Configurar Variables de Entorno
Crear `.env` en la raíz:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Desarrollo
```bash
npm run dev
```
Servidor disponible en `http://localhost:5173`

### Build para Producción
```bash
npm run build
npm run preview
```

## 📁 Estructura

```
src/
├── components/      # Componentes reutilizables
├── views/          # Páginas principales (rutas)
├── stores/         # Pinia stores (state management)
├── services/       # Llamadas a la API (Axios)
├── router/         # Configuración de rutas (Vue Router)
├── composables/    # Composables Vue reutilizables
├── types/          # Tipos TypeScript
└── utils/          # Utilidades
```

## 🛠️ Stack

- **Vue 3** (Composition API) + TypeScript
- **Vuetify 3** - UI Framework
- **Pinia** - State Management
- **TanStack Query** - Data Fetching
- **Vue Router 4** - Routing
- **Axios** - HTTP Client
- **VeeValidate + Zod** - Validación de formularios

## 📝 Tareas por Sprint

### Sprint 1.2: Autenticación (13-20 Ene)
- [ ] Página de Login
- [ ] Página de Registro
- [ ] Store de autenticación (Pinia)
- [ ] Protección de rutas
- [ ] Manejo de tokens JWT

### Sprint 2.1: CRUD Feedbacks (21-28 Ene)
- [ ] Vista de lista de feedbacks
- [ ] Vista de creación de feedback
- [ ] Vista de detalle/edición
- [ ] Filtros y paginación
- [ ] Servicios de API para feedbacks

### Sprint 2.2: Dashboard (29 Ene - 05 Feb)
- [ ] Vista de dashboard
- [ ] Estadísticas (gráficos/cards)
- [ ] Feedbacks recientes
- [ ] Navegación mejorada

### Sprint 3.1: Comentarios (06-13 Feb)
- [ ] Componente de comentarios
- [ ] Lista de comentarios en feedback
- [ ] Crear/eliminar comentarios

### Sprint 3.2: Notificaciones (14-20 Feb)
- [ ] Componente de notificaciones
- [ ] Contador de no leídas
- [ ] Marcar como leídas

### Sprint 4.2: Deployment (24 Feb)
- [ ] Deploy en Vercel
- [ ] Configurar variables de entorno
- [ ] Verificar conexión con backend

## 🔧 Configuración de Axios

El cliente está en `src/services/api.ts`:
- Base URL desde `.env`
- Interceptores configurados
- Manejo de errores global

## 📚 Documentación General

Ver [Propuesta Técnica](../Propuesta-De-Projecto.md) para detalles completos del proyecto.

# Backend - Sistema de Gestión de Feedback

## 🚀 Inicio Rápido

### Instalación
```bash
npm install
```

### Configuración

Las configuraciones están centralizadas en `src/config/constants.ts`. **No necesitas archivos `.env`**.

Todas las configuraciones (base de datos, JWT, servidor) están definidas directamente en el código para facilitar el mantenimiento.

### Base de Datos
```bash
# Generar cliente de Prisma
npm run prisma:generate

# Crear migraciones
npm run prisma:migrate

# Abrir Prisma Studio (GUI)
npm run prisma:studio
```

### Desarrollo
```bash
npm run dev
```
Servidor disponible en `http://localhost:3000`

### Producción
```bash
npm run build
npm start
```

## 📁 Estructura

```
src/
├── controllers/    # Lógica de negocio (handlers)
├── routes/         # Definición de rutas Express
├── middleware/     # Middlewares (auth, validación, errores)
├── services/       # Servicios auxiliares (lógica de negocio)
├── validators/     # Schemas de validación con Zod
└── utils/          # Utilidades
```

## 🛠️ Stack

- **Node.js** + Express + TypeScript
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas
- **Zod** - Validación de datos

## 📝 Tareas por Sprint

### Sprint 1.1: Base de Datos (02-09 Ene)
- [ ] Revisar schema Prisma (ya completo)
- [ ] Crear migraciones
- [ ] Seeders con datos de prueba
- [ ] Documentar relaciones

### Sprint 1.2: Autenticación (13-20 Ene)
- [x] Endpoints de registro/login (ya implementados)
- [ ] Endpoint de perfil de usuario
- [ ] Middleware de autenticación (ya implementado)
- [ ] Validaciones con Zod (ya implementadas)

### Sprint 2.1: CRUD Feedbacks (21-28 Ene)
- [ ] Endpoints CRUD de feedbacks
- [ ] Validación de relaciones jerárquicas
- [ ] Filtros y paginación
- [ ] Cambio de estado de feedbacks

### Sprint 2.2: Dashboard (29 Ene - 05 Feb)
- [ ] Endpoints de estadísticas
- [ ] Feedbacks recientes
- [ ] Agregaciones y conteos

### Sprint 3.1: Comentarios (06-13 Feb)
- [ ] Endpoints CRUD de comentarios
- [ ] Relación con feedbacks
- [ ] Validaciones

### Sprint 3.2: Notificaciones (14-20 Feb)
- [ ] Endpoints de notificaciones
- [ ] Lógica de creación automática
- [ ] Marcar como leídas
- [ ] Contador de no leídas

### Sprint 4.2: Deployment (24 Feb)
- [ ] Deploy en Render
- [ ] Configurar variables de entorno
- [ ] Ejecutar migraciones en producción
- [ ] Verificar health check

## 🔌 Endpoints Actuales

- `GET /health` - Health check
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login

## 📊 Modelos de Base de Datos

- **User** - Usuarios con roles (LEADER, EMPLOYEE)
- **TeamMember** - Relaciones líder-empleado
- **Feedback** - Feedbacks entre usuarios
- **Comment** - Comentarios en feedbacks
- **Notification** - Notificaciones in-app

Ver `prisma/schema.prisma` para detalles completos.

## 📚 Documentación General

Ver [Propuesta Técnica](../Propuesta-De-Projecto.md) para detalles completos del proyecto.

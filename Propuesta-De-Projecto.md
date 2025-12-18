# PROPUESTA TÉCNICA: SISTEMA DE GESTIÓN DE FEEDBACK EMPRESARIAL

**Equipo:** 4 Desarrolladores + 1 Líder Técnico  
**Duración:** 22 Dic 2025 - 24 Feb 2026

---

## 1. OBJETIVO

Aplicación web para gestión de feedback entre líderes y empleados con relaciones jerárquicas flexibles:
- Un líder puede ser empleado de otros líderes
- Relaciones bidireccionales múltiples y dinámicas
- **Nota:** Roles se asignan directamente desde la base de datos (no desde UI)

---

## 2. STACK TECNOLÓGICO

### Frontend
- Vue 3 + TypeScript + Vuetify 3
- Vite, Pinia, TanStack Query, Vue Router, Axios, VeeValidate + Zod

### Backend
- Node.js + Express + TypeScript
- Prisma ORM, PostgreSQL, JWT, bcrypt, Zod

### Deployment
- **Frontend: Vercel** (deployment obligatorio)
- **Backend: Render** (deployment obligatorio)
- BD: Supabase PostgreSQL o Render PostgreSQL

---

## 3. FUNCIONALIDADES CORE

1. **Autenticación:** Registro, Login, JWT, protección de rutas
2. **Roles:** Líder, Empleado (asignación directa desde BD)
3. **Feedbacks:** CRUD completo, tipos (Reconocimiento/Mejora/General), estados (Pendiente/En proceso/Completado)
4. **Comentarios:** Agregar, ver, eliminar en feedbacks
5. **Notificaciones:** In-app con contador de no leídas
6. **Dashboard:** Estadísticas y feedbacks recientes
7. **Perfiles:** Ver/editar perfil, ver relaciones jerárquicas

---

## 4. MODELO DE DATOS

### Schema Prisma

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role     @default(EMPLOYEE)
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  feedbacksSent     Feedback[] @relation("FeedbackFrom")
  feedbacksReceived Feedback[] @relation("FeedbackTo")
  comments          Comment[]
  notifications     Notification[]
  teamsLed          TeamMember[] @relation("TeamLeader")
  teamMemberships   TeamMember[] @relation("TeamMember")
}

model TeamMember {
  id        String   @id @default(uuid())
  leaderId  String
  memberId  String
  createdAt DateTime @default(now())
  
  leader    User     @relation("TeamLeader", fields: [leaderId], references: [id], onDelete: Cascade)
  member    User     @relation("TeamMember", fields: [memberId], references: [id], onDelete: Cascade)
  
  @@unique([leaderId, memberId])
  @@index([leaderId])
  @@index([memberId])
}

model Feedback {
  id          String        @id @default(uuid())
  fromUserId  String
  toUserId    String
  type        FeedbackType
  content     String
  status      FeedbackStatus @default(PENDING)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  fromUser    User          @relation("FeedbackFrom", fields: [fromUserId], references: [id])
  toUser      User          @relation("FeedbackTo", fields: [toUserId], references: [id])
  comments    Comment[]
  
  @@index([toUserId, status])
  @@index([fromUserId])
  @@index([createdAt])
}

model Comment {
  id         String   @id @default(uuid())
  feedbackId String
  userId     String
  content    String
  createdAt  DateTime @default(now())
  
  feedback   Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id])
  
  @@index([feedbackId])
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  message   String
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())
  
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, read])
}

enum Role {
  LEADER
  EMPLOYEE
}

enum FeedbackType {
  RECOGNITION
  IMPROVEMENT
  GENERAL
}

enum FeedbackStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum NotificationType {
  FEEDBACK_RECEIVED
  COMMENT_RECEIVED
  FEEDBACK_UPDATED
}
```

### Lógica de Roles

- **Líder:** Puede crear feedbacks a sus empleados directos y a sus propios líderes, puede ser empleado de otros líderes
- **Empleado:** Puede crear feedbacks a sus líderes directos
- **Asignación de Roles:** Se realiza directamente desde la base de datos (no hay UI para gestión de roles)

---

## 5. ESTRUCTURA DEL PROYECTO

```
feedbackProject/
├── Frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── views/          # Páginas principales
│   │   ├── stores/         # Pinia stores
│   │   ├── services/       # API calls
│   │   ├── router/         # Vue Router
│   │   ├── composables/    # Composables Vue
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilidades
│   └── package.json
│
├── Backend/
│   ├── src/
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── routes/        # Express routes
│   │   ├── middleware/    # Middlewares
│   │   ├── services/      # Servicios auxiliares
│   │   ├── validators/    # Zod schemas
│   │   └── utils/         # Utilidades
│   ├── prisma/
│   │   ├── schema.prisma  # Schema de BD
│   │   └── migrations/    # Migraciones
│   └── package.json
```

---

## 6. PLAN DE DESARROLLO

| Sprint | Objetivo | Fechas | Notas |
|--------|----------|--------|-------|
| 0.1 | Setup completo | 22-24 Dic 2025 | **Martes 24:** Todo instalado y funcionando |
| - | Semana libre | 25-31 Dic 2025 | Tareas para revisar el 2 Ene |
| 1.1 | Base de datos completa | 02-09 Ene 2026 | Revisión 2 Ene, trabajo hasta 9 Ene |
| 1.2 | Autenticación completa | 13-20 Ene 2026 | |
| 2.1 | CRUD Feedbacks | 21-28 Ene 2026 | |
| 2.2 | Dashboard | 29 Ene - 05 Feb 2026 | |
| 3.1 | Comentarios | 06-13 Feb 2026 | |
| 3.2 | Notificaciones | 14-20 Feb 2026 | |
| 4.1 | Testing y ajustes | 21-23 Feb 2026 | |
| 4.2 | **Deployment (Vercel + Render)** | 24 Feb 2026 | **Proyecto deployado y funcionando** |

---

## 7. PRÓXIMOS PASOS

1. ✅ Setup completado (24 Dic 2025)
2. ✅ Schema Prisma completo con todos los modelos
3. **Semana libre (25-31 Dic):** Tareas para revisar el 2 Ene
4. **2-9 Ene:** Trabajo en Base de Datos (Sprint 1.1)
5. Implementar endpoints y vistas según sprints
6. **24 Feb:** Deployment final en Vercel (Frontend) y Render (Backend)

### Notas Importantes
- **Martes 24 Dic:** Setup completo y funcionando
- **Semana libre:** Equipo se lleva tareas para revisar el 2 Ene
- **2 Ene:** Revisión y continuación del trabajo hasta 9 Ene
- **24 Feb:** Proyecto debe estar deployado y funcionando en producción


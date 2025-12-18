# DISEÑO UI - SISTEMA DE FEEDBACK EMPRESARIAL

**Complemento al documento técnico para desarrolladores**

---

## PALETA DE COLORES Y TIPOGRAFÍA

### Colores Base
```
Primary:    #1976D2  (Azul profesional - Vuetify default)
Secondary:  #424242  (Gris oscuro)
Accent:     #82B1FF  (Azul claro)
Success:    #4CAF50  (Verde - feedbacks completados)
Warning:    #FF9800  (Naranja - en progreso)
Error:      #F44336  (Rojo - urgente)
Background: #FAFAFA  (Gris muy claro)
Surface:    #FFFFFF  (Blanco)
```

### Tipografía
- **Fuente:** Roboto (default Vuetify)
- **Títulos:** 24px - 32px (Bold)
- **Body:** 14px - 16px (Regular)
- **Labels:** 12px - 14px (Medium)

---

## WIREFRAMES DE PANTALLAS

### 1. LOGIN

```
┌────────────────────────────────────┐
│                                    │
│        [LOGO] FeedbackApp          │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Email                        │  │
│  │ [________________________]   │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Contraseña                   │  │
│  │ [________________________]   │  │
│  └──────────────────────────────┘  │
│                                    │
│  [ INICIAR SESIÓN ]                │
│                                    │
│  ¿No tienes cuenta? Regístrate     │
│                                    │
└────────────────────────────────────┘
```

**Componentes Vuetify:**
- `v-text-field` (outlined)
- `v-btn` (block, color primary)
- `v-card` para contenedor

---

### 2. DASHBOARD

```
┌─────────────────────────────────────────────────────────────┐
│ [≡] FeedbackApp              [🔔 3]        [Juan Pérez ▾]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Dashboard                                                  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Pendientes  │  │ En Proceso  │  │ Completados │        │
│  │     8       │  │      3      │  │     15      │        │
│  │  PENDING    │  │ IN_PROGRESS │  │ COMPLETED   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  Feedbacks Recientes                      [+ Nuevo Feedback]│
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🟢 RECOGNITION                               PENDING   │ │
│  │ De: María González                      Hace 2 horas  │ │
│  │ "Excelente trabajo en el proyecto..."                │ │
│  │                                        [Ver detalles] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🟡 IMPROVEMENT                        IN_PROGRESS     │ │
│  │ Para: Carlos Ruiz                       Hace 1 día    │ │
│  │ "Mejorar la comunicación en daily..."                │ │
│  │                                        [Ver detalles] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Estadísticas mostradas:**
- Count de feedbacks por status (PENDING, IN_PROGRESS, COMPLETED)
- Lista de feedbacks recientes (últimos 10)
- Indicador visual por tipo (RECOGNITION 🟢, IMPROVEMENT 🟡, GENERAL ⚪)

**Componentes Vuetify:**
- `v-app-bar` con `v-app-bar-nav-icon`, `v-badge` (notificaciones), `v-menu` (perfil)
- `v-card` con `v-card-text` para estadísticas
- `v-list` con `v-list-item` para feedbacks recientes
- `v-chip` para estados y tipos

---

### 3. CREAR/DAR FEEDBACK

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Nuevo Feedback                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Para                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [▾ Seleccionar empleado/líder]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Tipo de Feedback                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [▾ Seleccionar tipo]                                │   │
│  │    • RECOGNITION (Reconocimiento)                   │   │
│  │    • IMPROVEMENT (Mejora)                           │   │
│  │    • GENERAL (General)                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Contenido                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [_____________________________________________]     │   │
│  │ [_____________________________________________]     │   │
│  │ [_____________________________________________]     │   │
│  │ [_____________________________________________]     │   │
│  │ [_____________________________________________]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                                             │
│                   [Cancelar]  [Enviar Feedback]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Validaciones:**
- Para: Requerido (lista basada en relaciones TeamMember)
- Tipo: Requerido (enum FeedbackType)
- Contenido: Requerido, mínimo 10 caracteres
- Estado inicial: PENDING (automático)

**Lógica de "Para":**
- Si user.role = LEADER: Muestra empleados directos (TeamMember donde leaderId = userId) + sus líderes
- Si user.role = EMPLOYEE: Muestra solo sus líderes directos

**Componentes Vuetify:**
- `v-select` para usuario y tipo
- `v-textarea` (outlined, counter) para contenido
- `v-btn` para acciones

---

### 4. DETALLE DE FEEDBACK

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Feedback #abc123                          [⋮ Opciones]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🟢 RECOGNITION                              [PENDING ▾]    │
│                                                             │
│  De: María González                         15 Dic 2025    │
│  Para: Juan Pérez                                           │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  Excelente trabajo en el proyecto Alpha. Tu liderazgo      │
│  fue clave para cumplir los objetivos. Destacó tu          │
│  capacidad de resolución de conflictos y comunicación.      │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  Comentarios (2)                                            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Juan Pérez                              16 Dic 2025   │ │
│  │ Gracias María! Fue un trabajo en equipo.             │ │
│  │                                              [Eliminar]│ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Carlos Ruiz                             16 Dic 2025   │ │
│  │ Totalmente de acuerdo, gran liderazgo.               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Agregar comentario...                               │   │
│  │ [_____________________________________________]     │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Enviar Comentario]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Estados disponibles (solo dueño puede cambiar):**
- PENDING → IN_PROGRESS → COMPLETED
- Cambio mediante dropdown en el header

**Comentarios:**
- Cualquier usuario puede comentar
- Solo el autor del comentario puede eliminarlo
- Ordenados cronológicamente (más recientes primero)

**Opciones (⋮):**
- Editar (solo autor del feedback)
- Eliminar (solo autor del feedback)
- Ver perfil de usuario

**Componentes Vuetify:**
- `v-chip` para tipo y estado
- `v-select` inline para cambiar estado
- `v-card` para comentarios
- `v-btn` (icon) para eliminar comentario
- `v-textarea` + `v-btn` para nuevo comentario

---

### 5. MI EQUIPO

```
┌─────────────────────────────────────────────────────────────┐
│ [≡] Mi Equipo                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Mis Empleados] [Mis Líderes]                              │
│                                                             │
│  ━━━ Mis Empleados (5) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [👤] María González                                   │ │
│  │      maria.gonzalez@empresa.com                       │ │
│  │      [💬 Dar Feedback]                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [👤] Carlos Ruiz                                      │ │
│  │      carlos.ruiz@empresa.com                          │ │
│  │      [💬 Dar Feedback]                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ━━━ Mis Líderes (2) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [👤] Ana Martínez                                     │ │
│  │      ana.martinez@empresa.com                         │ │
│  │      [💬 Dar Feedback]                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Lógica:**
- **Mis Empleados:** TeamMember donde leaderId = currentUserId
- **Mis Líderes:** TeamMember donde memberId = currentUserId
- Click en "Dar Feedback" pre-selecciona el usuario en formulario

**Nota:** Relaciones se gestionan desde BD, no desde UI

**Componentes Vuetify:**
- `v-tabs` para cambiar entre empleados y líderes
- `v-list` con `v-list-item` para cada persona
- `v-avatar` para foto/iniciales
- `v-btn` (text) para acciones

---

### 6. NOTIFICACIONES

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Notificaciones                      [Marcar todo leído] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Todas (15)] [No leídas (3)]                               │
│                                                             │
│  🔵 FEEDBACK_RECEIVED                      Hace 2 horas    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Nuevo feedback de María González                      │ │
│  │                                        [Ver feedback]  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  🔵 COMMENT_RECEIVED                       Hace 5 horas    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Carlos Ruiz comentó en tu feedback                    │ │
│  │                                        [Ver feedback]  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ⚪ FEEDBACK_UPDATED                       Hace 1 día      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Tu feedback cambió a estado IN_PROGRESS              │ │
│  │                                        [Ver feedback]  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tipos de notificación:**
- FEEDBACK_RECEIVED: Nuevo feedback recibido
- COMMENT_RECEIVED: Nuevo comentario en feedback
- FEEDBACK_UPDATED: Cambio de estado en feedback

**Comportamiento:**
- Badge en header muestra count de notificaciones no leídas
- Click en notificación la marca como leída y navega al feedback
- "Marcar todo leído" actualiza todas a read = true

**Componentes Vuetify:**
- `v-badge` (en header)
- `v-tabs` para filtrar
- `v-list` con `v-list-item` para notificaciones
- Punto azul 🔵 para no leídas, gris ⚪ para leídas

---

### 7. PERFIL

```
┌─────────────────────────────────────────────────────────────┐
│ [←] Mi Perfil                                    [Editar]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│        [👤]                                                 │
│     Juan Pérez                                              │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  Email:    juan.perez@empresa.com                           │
│  Rol:      LEADER                                           │
│  Miembro desde: 15 Dic 2024                                 │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  Relaciones Jerárquicas                                     │
│                                                             │
│  Lidera a: 5 empleados                                      │
│  Reporta a: 2 líderes                                       │
│                                          [Ver mi equipo →]  │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  Estadísticas                                               │
│                                                             │
│  Feedbacks dados:      23                                   │
│  Feedbacks recibidos:  18                                   │
│  Comentarios:          47                                   │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│                                          [🚪 Cerrar Sesión] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Edición permitida:**
- Nombre
- Email
- Contraseña (con confirmación)

**Datos solo lectura:**
- Rol (se asigna desde BD)
- Relaciones (se gestionan desde BD)
- Estadísticas (calculadas)

**Componentes Vuetify:**
- `v-avatar` (tamaño xl)
- `v-list` para información
- `v-divider` para separadores
- `v-btn` para cerrar sesión

---

## FLUJOS DE USUARIO

### Flujo: Dar Feedback

1. Dashboard → Click "+ Nuevo Feedback"
2. Formulario: Seleccionar destinatario (lista filtrada por relaciones)
3. Seleccionar tipo (RECOGNITION/IMPROVEMENT/GENERAL)
4. Escribir contenido (min 10 chars)
5. Click "Enviar Feedback"
6. Sistema crea feedback con status PENDING
7. Sistema crea notificación FEEDBACK_RECEIVED para destinatario
8. Redirect a dashboard con mensaje de éxito

### Flujo: Gestionar Estado de Feedback

1. Dashboard → Click en feedback recibido
2. Vista detalle del feedback
3. Si es owner: Click en dropdown de estado
4. Cambiar: PENDING → IN_PROGRESS → COMPLETED
5. Sistema actualiza feedback.status
6. Sistema crea notificación FEEDBACK_UPDATED para autor
7. UI actualiza en tiempo real

### Flujo: Comentar en Feedback

1. Vista detalle de feedback
2. Escribir comentario en textarea
3. Click "Enviar Comentario"
4. Sistema crea Comment asociado al Feedback
5. Sistema crea notificación COMMENT_RECEIVED para owner del feedback
6. Comentario aparece en lista inmediatamente

---

## COMPONENTES REUTILIZABLES

### FeedbackCard
```vue
<v-card>
  <v-card-title>
    <v-chip :color="typeColor">{{ feedback.type }}</v-chip>
    <v-chip :color="statusColor">{{ feedback.status }}</v-chip>
  </v-card-title>
  <v-card-text>
    {{ feedback.content }}
  </v-card-text>
  <v-card-actions>
    <v-btn>Ver detalles</v-btn>
  </v-card-actions>
</v-card>
```

### NotificationBadge
```vue
<v-badge
  :content="unreadCount"
  :value="unreadCount > 0"
  color="error"
>
  <v-icon>mdi-bell</v-icon>
</v-badge>
```

### UserAvatar
```vue
<v-avatar :color="user.role === 'LEADER' ? 'primary' : 'secondary'">
  {{ user.name[0] }}
</v-avatar>
```

---

## COLORES POR TIPO Y ESTADO

### Tipos de Feedback
- RECOGNITION: `success` (#4CAF50)
- IMPROVEMENT: `warning` (#FF9800)
- GENERAL: `info` (#2196F3)

### Estados
- PENDING: `grey` (#9E9E9E)
- IN_PROGRESS: `warning` (#FF9800)
- COMPLETED: `success` (#4CAF50)

---

## NOTAS DE IMPLEMENTACIÓN

### Vuetify Configuration
```js
// Usar tema predeterminado con ajustes mínimos
theme: {
  defaultTheme: 'light',
  themes: {
    light: {
      primary: '#1976D2',
      secondary: '#424242',
      accent: '#82B1FF',
      error: '#F44336',
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FF9800',
    },
  },
}
```

### Layout Responsive
- Mobile: Stack vertical, navigation drawer
- Tablet/Desktop: Sidebar fijo, contenido centrado (max-width: 1200px)

### Loading States
- Usar `v-progress-circular` para loading
- Skeleton loaders para listas con `v-skeleton-loader`

### Error Handling
- `v-snackbar` para mensajes de éxito/error
- `v-alert` para errores de formulario

---

## PRIORIDAD DE PANTALLAS

Sprint 1.2 (Autenticación):
- Login
- Registro

Sprint 2.1 (CRUD Feedbacks):
- Dashboard
- Crear Feedback
- Detalle Feedback

Sprint 2.2 (Dashboard):
- Dashboard mejorado con estadísticas

Sprint 3.1 (Comentarios):
- Detalle Feedback con comentarios

Sprint 3.2 (Notificaciones):
- Panel de Notificaciones
- Badge en header

Continuo:
- Mi Equipo
- Perfil

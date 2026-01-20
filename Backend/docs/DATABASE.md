# Modelo de Relaciones y Base de Datos

## Tabla TeamMember (Jerarquía Flexible)
El sistema utiliza una relación reflexiva (User-to-User) a través de la tabla `TeamMember`. Esto permite estructuras matriciales donde un empleado tiene múltiples líderes.

### Definición Técnica
* **Relación:** N:M (Muchos a Muchos) entre `User` y `User`.
* **Restricción de Unicidad:** `@@unique([leaderId, memberId])`. Evita duplicar la misma relación.
* **Borrado en Cascada:** Si se borra un usuario, sus relaciones en `TeamMember` se eliminan.

### Queries Comunes

#### 1. Obtener empleados de un líder
```typescript
const employees = await prisma.teamMember.findMany({
  where: { leaderId: userId },
  include: { member: true }
});

//  2. Obtener líderes de un empleado

const leaders = await prisma.teamMember.findMany({
  where: { memberId: userId },
  include: { leader: true }
});

// 3. Verificar si existe relación (para permisos de Feedback)

const canGiveFeedback = await prisma.teamMember.findFirst({
  where: {
    OR: [
      { leaderId: fromUserId, memberId: toUserId }, // Soy su líder
      { leaderId: toUserId, memberId: fromUserId }  // Es mi líder
    ]
  }
});

// 
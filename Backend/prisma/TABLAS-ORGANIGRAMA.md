# Tablas del organigrama

En este proyecto **el código usa solo**:

- **`OrgArea`** – áreas del organigrama
- **`OrgPosition`** – posiciones (cada una pertenece a un área)
- **`UserOrgPosition`** – asignación usuario ↔ posición

Los modelos en `schema.prisma` son `OrgArea` y `OrgPosition` (sin `@@map`), por lo que en la base de datos las tablas se llaman **OrgArea** y **OrgPosition**.

Si en tu base ves también tablas **`Area`** y **`Position`**, son de otro esquema o migración antigua. **No las usa este backend.** Puedes borrarlas en la BD si quieres evitar confusiones (o dejarlas; el código no las toca).

Poblar organigrama:

```bash
npm run seed:org
```

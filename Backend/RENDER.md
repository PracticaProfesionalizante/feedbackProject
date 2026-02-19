# Configuración de Render (no modificar si el deploy anda)

Esta es la **única configuración que funciona** para este backend en Render. No cambiar build/start ni quitar variables sin revisar.

## Servicio Web

- **Root Directory:** La carpeta del Backend en el repo.  
  Ej.: `Backend` si la ruta es `feedbackProject/Backend/package.json`; `src/Backend` si es `feedbackProject/src/Backend/package.json`.

- **Build Command:**
  ```bash
  npm install && npx prisma generate && npx prisma migrate deploy && npm run build
  ```

- **Start Command:**
  ```bash
  npm start
  ```

## Variables de entorno (obligatorias)

| Variable       | Uso |
|----------------|-----|
| `DATABASE_URL` | Conexión a PostgreSQL (Supabase: usar **pooler**, puerto **6543**). La usa la app en runtime. |
| `DIRECT_URL`   | Conexión **directa** a PostgreSQL (Supabase: puerto **5432**). La usa **solo** `prisma migrate deploy`; con el pooler las migraciones pueden colgarse. |

Otras que ya uses (JWT, CORS, etc.) se dejan como estén.

## Dependencias y build

- `@prisma/client`, `prisma` y los `@types/*` necesarios están en **dependencies** (no en devDependencies) para que el build en Render los instale.
- La URL de la base se toma de `prisma.config.cjs`: usa `DIRECT_URL` si está definida, si no `DATABASE_URL`.
- No tocar `prisma.config.cjs` para no romper migraciones en Render.

## Si los feedbacks devuelven 500 (columna no existe)

Si la API de feedback devuelve algo como *"The column (not available) does not exist"* (P2022), suele ser que en **Supabase** falta la columna `feedbackId` en la tabla `Notification`.

**Opción A — desde tu máquina (recomendado):** en la carpeta del Backend, con `DIRECT_URL` o `DATABASE_URL` en tu `.env` apuntando a Supabase, ejecutá:

```bash
npm run db:fix-notification
```

**Opción B — manual en Supabase:** en Supabase → SQL Editor, ejecutá el contenido de **`scripts/supabase-fix-notification.sql`**.

Después de aplicarlo, no hace falta redeploy en Render; con recargar la app suele bastar.

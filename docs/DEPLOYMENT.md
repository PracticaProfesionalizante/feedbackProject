# Guía de Deployment

## Deployment Obligatorio

El proyecto debe estar deployado en:
- **Frontend:** Vercel
- **Backend:** Render

## Frontend - Vercel

### Prerrequisitos
- Cuenta en Vercel
- Repositorio Git conectado

### Pasos

1. **Instalar Vercel CLI (opcional)**
```bash
npm i -g vercel
```

2. **Deploy desde Vercel Dashboard**
   - Ir a [vercel.com](https://vercel.com)
   - Importar proyecto desde Git
   - Seleccionar carpeta `Frontend`
   - Configurar variables de entorno:
     ```
     VITE_API_BASE_URL=https://tu-backend.render.com/api
     ```

3. **Deploy desde CLI**
```bash
cd Frontend
vercel
```

### Variables de Entorno en Vercel
- `VITE_API_BASE_URL` - URL del backend en producción

### Build Settings
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Backend - Render

### Prerrequisitos
- Cuenta en Render
- Repositorio Git conectado
- Base de datos PostgreSQL (Render o Supabase)

### Pasos

1. **Crear Web Service en Render**
   - Ir a [render.com](https://render.com)
   - New → Web Service
   - Conectar repositorio Git
   - Configurar:
     - **Name:** feedback-backend
     - **Root Directory:** Backend
     - **Environment:** Node
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`

2. **Configurar Variables de Entorno**
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=tu-secret-key-super-segura
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   CORS_ORIGIN=https://tu-frontend.vercel.app
   PORT=10000
   ```

3. **Base de Datos PostgreSQL**
   - Opción 1: Render PostgreSQL (New → PostgreSQL)
   - Opción 2: Supabase PostgreSQL
   - Copiar connection string a `DATABASE_URL`

4. **Ejecutar Migraciones**
   - En Render, usar Shell o agregar en build command:
   ```bash
   npm install && npm run build && npm run prisma:generate && npm run prisma:migrate deploy
   ```

### Variables de Entorno en Render
- `DATABASE_URL` - Connection string de PostgreSQL
- `JWT_SECRET` - Secret key para JWT
- `JWT_EXPIRES_IN` - Expiración de tokens
- `NODE_ENV` - production
- `CORS_ORIGIN` - URL del frontend en Vercel
- `PORT` - Puerto (Render usa 10000 por defecto)

## Checklist de Deployment

### Frontend (Vercel)
- [ ] Repositorio conectado
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] URL de producción funcionando
- [ ] Conectado correctamente al backend

### Backend (Render)
- [ ] Repositorio conectado
- [ ] Base de datos PostgreSQL creada
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas
- [ ] Build exitoso
- [ ] Servidor corriendo
- [ ] Health check funcionando (`/health`)

### Post-Deployment
- [ ] Probar registro de usuario
- [ ] Probar login
- [ ] Probar creación de feedbacks
- [ ] Verificar CORS configurado correctamente
- [ ] Verificar que las URLs estén actualizadas en frontend

## Troubleshooting

### Frontend no conecta con Backend
- Verificar `VITE_API_BASE_URL` en Vercel
- Verificar CORS en Render (`CORS_ORIGIN`)
- Verificar que el backend esté corriendo

### Backend no conecta con Base de Datos
- Verificar `DATABASE_URL` en Render
- Verificar que las migraciones se ejecutaron
- Verificar que Prisma Client está generado

### Build Fails
- Verificar que todas las dependencias estén en `package.json`
- Verificar que no haya errores de TypeScript
- Revisar logs de build en Vercel/Render

## URLs de Ejemplo

- Frontend: `https://feedback-app.vercel.app`
- Backend: `https://feedback-backend.onrender.com`
- API: `https://feedback-backend.onrender.com/api`


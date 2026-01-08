# 📘 Documentación de API - Social Learning

Esta API gestiona la autenticación y el perfil de usuarios para la plataforma de aprendizaje social.

---

## 🔐 Autenticación

### 1. Registrar Nuevo Usuario
Crea una cuenta nueva en el sistema.

- **URL:** `/api/auth/register`
- **Método:** `POST`
- **Body (JSON):**
  ```json
  {
    "email": "nuevo@test.com",
    "name": "Ana García",
    "password": "password123",
    "role": "EMPLOYEE" // Opcional (Default: EMPLOYEE)
  }
  
  Respuesta Exitosa (201 Created):

JSON

{
  "token": "eyJhbGciOiJIUz...",
  "user": {
    "id": "uuid-gen-123",
    "email": "nuevo@test.com",
    "name": "Ana García",
    "role": "EMPLOYEE"
  }
}
Errores:

400 Bad Request: Email ya registrado o datos inválidos.

2. Iniciar Sesión (Login)
Autentica a un usuario existente y devuelve un token JWT.

URL: /api/auth/login

Método: POST

Body (JSON):

JSON

{
  "email": "nuevo@test.com",
  "password": "password123"
}
Respuesta Exitosa (200 OK):

JSON

{
  "token": "eyJhbGciOiJIUz...",
  "user": {
    "id": "uuid-gen-123",
    "email": "nuevo@test.com",
    "name": "Ana García",
    "role": "EMPLOYEE"
  }
}
Errores:

401 Unauthorized: Credenciales incorrectas.

👤 Usuarios
3. Obtener Perfil
Obtiene los datos del usuario logueado, incluyendo sus estadísticas y resumen de equipo.

URL: /api/users/profile

Método: GET

Headers:

Authorization: Bearer <TU_TOKEN_AQUI>

Respuesta Exitosa (200 OK):

JSON

{
  "id": "uuid-gen-123",
  "name": "Ana García",
  "email": "nuevo@test.com",
  "role": "LEADER",
  "createdAt": "2026-01-03T10:00:00.000Z",
  "stats": {
    "feedbacksGiven": 5,
    "feedbacksReceived": 2,
    "comments": 12
  },
  "teamInfo": {
    "employeesCount": 3,
    "leadersCount": 0
  }
}
Errores:

401 Unauthorized: No enviaste token o el token expiró.
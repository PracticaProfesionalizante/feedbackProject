import request from 'supertest';
import { app, server } from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cerramos la conexión y el servidor al terminar todos los tests
afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe('🔐 Auth API Tests', () => {
  // Generamos un email único para cada ejecución para evitar error de duplicados
  const uniqueEmail = `test_${Date.now()}@example.com`;
  const userData = {
    email: uniqueEmail,
    name: 'Test User',
    password: 'password123'
  };

  let token = ''; // Aquí guardaremos el token para usarlo en el test de perfil

  // 1️⃣ TEST DE REGISTRO
  describe('POST /api/auth/register', () => {
    test('✅ Debe registrar usuario exitosamente', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Esperamos que cree el usuario
      // NOTA: Si Marcos no terminó esto, podría dar 404 o 500, pero el test está bien planteado.
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('❌ Debe fallar con email duplicado', async () => {
      // Intentamos registrar al mismo usuario de nuevo
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400); // Bad Request
    });
  });

  // 2️⃣ TEST DE LOGIN
  describe('POST /api/auth/login', () => {
    test('✅ Debe hacer login exitosamente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      
      // Guardamos el token para el siguiente test
      token = response.body.token;
    });

    test('❌ Debe fallar con credenciales incorrectas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        });

      // Puede ser 400 o 401 según como lo programó Marcos
      expect([400, 401]).toContain(response.status);
    });
  });

  // 3️⃣ TEST DE PERFIL (Lo que hiciste tú)
  describe('GET /api/users/profile', () => {
    test('❌ Debe fallar sin token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      // Como quitamos el "Mock" y no hay Auth middleware real,
      // tu controlador retorna 401 si no hay req.user.
      // O si el middleware falta, podría dar error 500.
      // Lo correcto es esperar 401.
      expect(response.status).toBe(401);
    });

    // ⚠️ ESTE TEST FALLARÁ HASTA QUE MARCOS TERMINE EL MIDDLEWARE DE AUTH// 👇 CAMBIO: De 'test.skip' a 'test'
    test('✅ Debe obtener perfil con token válido', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`); // Usa el token que guardamos en el login

      expect(response.status).toBe(200);
      // Verificamos que traiga datos del usuario
      expect(response.body).toHaveProperty('email', userData.email);
      // Verificamos que traiga tus estadísticas
      expect(response.body).toHaveProperty('stats'); 
    });
  });
});
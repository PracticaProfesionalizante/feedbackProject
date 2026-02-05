import request from 'supertest'
import { app } from '../../index'

export async function registerAndLogin(email: string, password: string, name: string) {
  await request(app).post('/api/auth/register').send({ email, password, name })

  const login = await request(app).post('/api/auth/login').send({ email, password })

  const token = login.body?.data?.token
  if (!token) {
    throw new Error(`Login no devolvió token. Body: ${JSON.stringify(login.body)}`)
  }

  return token as string
}


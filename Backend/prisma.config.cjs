'use strict'
// Prisma CLI (migrate deploy) usa DIRECT_URL si está definida, sino DATABASE_URL.
// Con Supabase: el pooler (6543) hace colgar migrate; hace falta conexión directa (5432) para migraciones.
try { require('dotenv/config') } catch (_) {}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL or DIRECT_URL must be set')

module.exports = {
  datasource: { url },
}

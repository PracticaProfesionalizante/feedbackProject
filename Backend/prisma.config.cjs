'use strict'
// Prisma 7: la URL va en el config. Sin require('prisma/config') para que funcione en Render
// aunque npm install se ejecute desde otra carpeta.
try { require('dotenv/config') } catch (_) {}

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

module.exports = {
  datasource: {
    url,
    ...(process.env.DIRECT_URL && { shadowDatabaseUrl: process.env.DIRECT_URL }),
  },
}

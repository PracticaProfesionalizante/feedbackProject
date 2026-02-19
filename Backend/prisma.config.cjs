'use strict'
// Prisma 7: la URL va en el config, no en el schema. Usar dotenv para cargar .env en local.
try { require('dotenv/config') } catch (_) {}

const { defineConfig, env } = require('prisma/config')

module.exports = defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
    shadowDatabaseUrl: process.env.DIRECT_URL,
  },
})

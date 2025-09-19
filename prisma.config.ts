// prisma.config.ts
import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    // Prisma runs this when you call: npx prisma db seed
    seed: 'tsx prisma/seed.ts',
  },
})

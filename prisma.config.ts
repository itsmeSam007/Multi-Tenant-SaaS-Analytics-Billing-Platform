import type { PrismaConfig } from "prisma";
import { defineConfig,env } from '@prisma/config';
import 'dotenv/config';

// Earlier corrected code block
// export default defineConfig({
//   schema: './prisma/schema.prisma',
  
//   migrations: {
//     path: "prisma/migrations",
//   },
//   datasource: {
//     url: 'postgresql://app_user:secret@localhost:5432/app_db', // or process.env.DATABASE_URL as string
//     //url: process.env.DATABASE_URL!, // or process.env.DATABASE_URL as string
//   },
// })satisfies PrismaConfig;
// Earlier corrected code block


export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
   datasource: {
    url: process.env.DATABASE_URL!,  // ✅ dynamic
  },
}) satisfies PrismaConfig;
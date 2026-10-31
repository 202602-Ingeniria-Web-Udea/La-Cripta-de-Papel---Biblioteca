import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('La variable DATABASE_URL no está definida en el archivo .env');
}

const adapter = new PrismaPg(
  { connectionString },
  {
    schema: 'public',
  }
);

const prisma = new PrismaClient({ adapter });

export { prisma };

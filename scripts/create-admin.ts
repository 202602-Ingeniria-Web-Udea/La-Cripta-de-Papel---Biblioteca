import 'dotenv/config';
import { input, password } from '@inquirer/prompts';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const scrypt = promisify(scryptCallback);

async function main(): Promise<void> {
  const name = (await input({ message: 'Nombre:' })).trim();
  const lastName = (await input({ message: 'Apellido:' })).trim();
  const email = (
    await input({ message: 'Correo electronico:' })
  ).trim().toLowerCase();

  const userPassword = await password({
    message: 'Contrasena (minimo 8 caracteres):',
    mask: '*',
  });

  if (!name || !lastName) {
    throw new Error('El nombre y el apellido son obligatorios.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('El correo electronico no tiene un formato valido.');
  }

  if (userPassword.length < 8) {
    throw new Error('La contrasena debe tener al menos 8 caracteres.');
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('No se encontro DATABASE_URL en el archivo .env.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }, { schema: 'public' }),
  });

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN', deleted: false },
      select: { id: true },
    });

    if (existingAdmin) {
      throw new Error(
        'Ya existe un administrador. No se creo ningun usuario.',
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new Error('Ya existe un usuario con ese correo electronico.');
    }

    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(
      userPassword,
      salt,
      64,
    )) as Buffer;

    const passwordHash = `${salt}:${derivedKey.toString('hex')}`;

    const admin = await prisma.user.create({
      data: {
        name,
        lastName,
        email,
        passwordHash,
        role: 'ADMIN',
        enabled: true,
        deleted: false,
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    console.log('\nAdministrador creado correctamente:');
    console.log(`Nombre: ${admin.name} ${admin.lastName}`);
    console.log(`Correo: ${admin.email}`);
    console.log(`Rol: ${admin.role}`);
    console.log('\nYa puedes intentar iniciar sesion en /login.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    '\nNo fue posible crear el administrador:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});

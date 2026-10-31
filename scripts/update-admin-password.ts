
import 'dotenv/config';

import { password } from '@inquirer/prompts';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const scrypt = promisify(scryptCallback);

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('No se encontro DATABASE_URL en el archivo .env.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }, { schema: 'public' }),
  });

  try {
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        deleted: false,
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        enabled: true,
      },
    });

    if (!admin) {
      throw new Error('No se encontro una cuenta administradora.');
    }

    if (!admin.enabled) {
      throw new Error('La cuenta administradora esta deshabilitada.');
    }

    console.log('\nCuenta administradora encontrada:');
    console.log(`Nombre: ${admin.name} ${admin.lastName ?? ''}`);
    console.log(`Correo: ${admin.email}`);

    const newPassword = await password({
      message: 'Nueva contrasena (minimo 8 caracteres):',
      mask: '*',
    });

    const confirmPassword = await password({
      message: 'Confirma la nueva contrasena:',
      mask: '*',
    });

    if (newPassword.length < 8) {
      throw new Error('La contrasena debe tener al menos 8 caracteres.');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('Las contrasenas no coinciden. No se realizaron cambios.');
    }

    const salt = randomBytes(16).toString('hex');

    const derivedKey = (await scrypt(
      newPassword,
      salt,
      64,
    )) as Buffer;

    const passwordHash = `${salt}:${derivedKey.toString('hex')}`;

    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    console.log('\nLa contrasena del administrador se actualizo correctamente.');
    console.log('Ya puedes iniciar sesion con la nueva contrasena.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    '\nNo fue posible actualizar la contrasena:',
    error instanceof Error ? error.message : error,
  );

  process.exitCode = 1;
});

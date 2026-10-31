import { scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';

const scrypt = promisify(scryptCallback);

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, hashHex] = storedHash.split(':');

  if (!salt || !hashHex || !/^[0-9a-f]{128}$/i.test(hashHex)) {
    return false;
  }

  const expectedHash = Buffer.from(hashHex, 'hex');
  const actualHash = (await scrypt(
    password,
    salt,
    expectedHash.length,
  )) as Buffer;

  return (
    actualHash.length === expectedHash.length &&
    timingSafeEqual(actualHash, expectedHash)
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== 'object' ||
      body === null ||
      !('email' in body) ||
      !('password' in body) ||
      typeof body.email !== 'string' ||
      typeof body.password !== 'string' ||
      !body.email.trim() ||
      !body.password
    ) {
      return NextResponse.json(
        { error: 'Ingresa un correo electrónico y una contraseña.' },
        { status: 400 },
      );
    }

    const email = body.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        passwordHash: true,
        role: true,
        enabled: true,
        deleted: true,
      },
    });

    if (!user || user.deleted || !user.enabled) {
      return NextResponse.json(
        { error: 'Correo electrónico o contraseña incorrectos.' },
        { status: 401 },
      );
    }

    const validPassword = await verifyPassword(
      body.password,
      user.passwordHash,
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Correo electrónico o contraseña incorrectos.' },
        { status: 401 },
      );
    }

    // Crear una sesión persistente para el usuario autenticado.
    await createSession({
      userId: user.id,
      role: user.role,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error during login:', error);

    return NextResponse.json(
      { error: 'No fue posible procesar el inicio de sesión.' },
      { status: 500 },
    );
  }
}

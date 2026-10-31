import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;

  return `${salt}:${hash.toString('hex')}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para continuar.' },
        { status: 401 },
      );
    }

    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para consultar usuarios.' },
        { status: 403 },
      );
    }

    const userId = new URL(request.url).searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere el ID del usuario.' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deleted: false,
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
        enabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);

    return NextResponse.json(
      { error: 'No fue posible consultar el usuario.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para continuar.' },
        { status: 401 },
      );
    }

    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear usuarios.' },
        { status: 403 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== 'object' ||
      body === null ||
      !('user' in body) ||
      typeof body.user !== 'object' ||
      body.user === null
    ) {
      return NextResponse.json(
        { error: 'El formato de los datos es inválido.' },
        { status: 400 },
      );
    }

    const user = body.user as Record<string, unknown>;
    const { name, lastName, email, role, password } = user;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 8 ||
      (lastName !== undefined &&
        lastName !== null &&
        typeof lastName !== 'string') ||
      (role !== 'ADMIN' && role !== 'USER')
    ) {
      return NextResponse.json(
        {
          error:
            'Verifica los datos. Se requiere nombre, correo válido, contraseña de al menos 8 caracteres y rol ADMIN o USER.',
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const passwordHash = await hashPassword(password);

    const createdUser = await prisma.user.create({
      data: {
        name: name.trim(),
        lastName:
          typeof lastName === 'string' && lastName.trim()
            ? lastName.trim()
            : null,
        email: normalizedEmail,
        role,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        role: true,
        enabled: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: createdUser }, { status: 201 });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese correo electrónico.' },
        { status: 409 },
      );
    }

    console.error('Error creating user:', error);

    return NextResponse.json(
      { error: 'No fue posible crear el usuario.' },
      { status: 500 },
    );
  }
}

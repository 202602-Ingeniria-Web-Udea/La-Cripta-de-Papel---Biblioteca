import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(): Promise<NextResponse> {
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
        { error: 'No tienes permisos para consultar los usuarios.' },
        { status: 403 },
      );
    }

    const users = await prisma.user.findMany({
      where: { deleted: false },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        enabled: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);

    return NextResponse.json(
      { error: 'No fue posible consultar los usuarios.' },
      { status: 500 },
    );
  }
}

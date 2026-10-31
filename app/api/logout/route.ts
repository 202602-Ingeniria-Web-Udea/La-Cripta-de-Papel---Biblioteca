import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export async function POST(): Promise<NextResponse> {
  try {
    await deleteSession();

    return NextResponse.json(
      { message: 'Sesión cerrada correctamente.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error during logout:', error);

    return NextResponse.json(
      { error: 'No fue posible cerrar la sesión.' },
      { status: 500 },
    );
  }
}

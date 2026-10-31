import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getBookAvailability } from '@/lib/inventory';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para continuar.' },
        { status: 401 },
      );
    }

    const loans = await prisma.loan.findMany({
      where:
        currentUser.role === 'ADMIN'
          ? {}
          : { userId: currentUser.id },
      select: {
        id: true,
        status: true,
        requestedAt: true,
        approvedAt: true,
        dueDate: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            returnedAt: true,
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    return NextResponse.json(loans, { status: 200 });
  } catch (error) {
    console.error('Error fetching loans:', error);

    return NextResponse.json(
      { error: 'No fue posible consultar los préstamos.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para continuar.' },
        { status: 401 },
      );
    }

    if (currentUser.role !== 'USER') {
      return NextResponse.json(
        { error: 'Solo los usuarios pueden solicitar préstamos.' },
        { status: 403 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== 'object' ||
      body === null ||
      !('items' in body) ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos un libro.' },
        { status: 400 },
      );
    }

    const requestedItems: { bookId: string; quantity: number }[] = [];

    for (const item of body.items) {
      if (
        typeof item !== 'object' ||
        item === null ||
        !('bookId' in item) ||
        typeof item.bookId !== 'string' ||
        !item.bookId.trim() ||
        !('quantity' in item) ||
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100000
      ) {
        return NextResponse.json(
          { error: 'Los datos de uno o varios libros no son válidos.' },
          { status: 400 },
        );
      }

      requestedItems.push({
        bookId: item.bookId.trim(),
        quantity: item.quantity,
      });
    }

    const bookIds = requestedItems.map((item) => item.bookId);

    if (new Set(bookIds).size !== bookIds.length) {
      return NextResponse.json(
        { error: 'No puedes incluir el mismo libro más de una vez.' },
        { status: 400 },
      );
    }

    const books = await prisma.book.findMany({
      where: {
        id: { in: bookIds },
        enabled: true,
        deleted: false,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (books.length !== requestedItems.length) {
      return NextResponse.json(
        { error: 'Uno o varios libros no existen o no están disponibles para solicitar.' },
        { status: 400 },
      );
    }

    for (const item of requestedItems) {
      const book = books.find((candidate) => candidate.id === item.bookId);

      if (!book) {
        return NextResponse.json(
          { error: 'Uno de los libros seleccionados no está disponible.' },
          { status: 400 },
        );
      }

      const availableCopies = await getBookAvailability(
        prisma,
        item.bookId,
      );

      if (item.quantity > availableCopies) {
        return NextResponse.json(
          {
            error: `No hay suficientes ejemplares disponibles de "${book.title}". Disponibles: ${availableCopies}.`,
          },
          { status: 400 },
        );
      }
    }

    const loan = await prisma.loan.create({
      data: {
        userId: currentUser.id,
        status: 'REQUESTED',
        items: {
          create: requestedItems.map((item) => ({
            bookId: item.bookId,
            quantity: item.quantity,
          })),
        },
      },
      select: {
        id: true,
        status: true,
        requestedAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            book: {
              select: {
                id: true,
                title: true,
                author: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'La solicitud de préstamo se registró correctamente.',
        loan,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating loan:', error);

    return NextResponse.json(
      { error: 'No fue posible crear la solicitud de préstamo.' },
      { status: 500 },
    );
  }
}

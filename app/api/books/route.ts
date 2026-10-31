import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para continuar.' },
        { status: 401 },
      );
    }

    const books = await prisma.book.findMany({
      where: {
        deleted: false,
        ...(currentUser.role === 'USER' && {
          enabled: true,
        }),
      },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        description: true,
        totalCopies: true,
        enabled: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ books }, { status: 200 });
  } catch (error) {
    console.error('Error fetching books:', error);

    return NextResponse.json(
      { error: 'No fue posible consultar los libros.' },
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

    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear libros.' },
        { status: 403 },
      );
    }

    const body: unknown = await request.json();

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Los datos enviados no son válidos.' },
        { status: 400 },
      );
    }

    if (
      !('title' in body) ||
      typeof body.title !== 'string' ||
      !body.title.trim() ||
      body.title.trim().length > 200
    ) {
      return NextResponse.json(
        { error: 'El título es obligatorio y no puede superar los 200 caracteres.' },
        { status: 400 },
      );
    }

    if (
      !('author' in body) ||
      typeof body.author !== 'string' ||
      !body.author.trim() ||
      body.author.trim().length > 150
    ) {
      return NextResponse.json(
        { error: 'El autor es obligatorio y no puede superar los 150 caracteres.' },
        { status: 400 },
      );
    }

    if (
      !('categoryId' in body) ||
      typeof body.categoryId !== 'string' ||
      !body.categoryId.trim()
    ) {
      return NextResponse.json(
        { error: 'Debes seleccionar una categoría.' },
        { status: 400 },
      );
    }

    let description: string | null = null;

    if (
      'description' in body &&
      body.description !== undefined &&
      body.description !== null
    ) {
      if (typeof body.description !== 'string') {
        return NextResponse.json(
          { error: 'La descripción debe ser un texto.' },
          { status: 400 },
        );
      }

      description = body.description.trim() || null;

      if (description && description.length > 2000) {
        return NextResponse.json(
          { error: 'La descripción no puede superar los 2000 caracteres.' },
          { status: 400 },
        );
      }
    }

    let isbn: string | null = null;

    if ('isbn' in body && body.isbn !== undefined && body.isbn !== null) {
      if (typeof body.isbn !== 'string') {
        return NextResponse.json(
          { error: 'El ISBN debe ser un texto.' },
          { status: 400 },
        );
      }

      isbn = body.isbn.trim() || null;

      if (isbn && isbn.length > 20) {
        return NextResponse.json(
          { error: 'El ISBN no puede superar los 20 caracteres.' },
          { status: 400 },
        );
      }
    }

    if (
      !('totalCopies' in body) ||
      typeof body.totalCopies !== 'number' ||
      !Number.isSafeInteger(body.totalCopies) ||
      body.totalCopies < 1 ||
      body.totalCopies > 100000
    ) {
      return NextResponse.json(
        { error: 'La cantidad de ejemplares debe ser un entero entre 1 y 100000.' },
        { status: 400 },
      );
    }

    const title = body.title.trim();
    const author = body.author.trim();
    const totalCopies = body.totalCopies;

    const category = await prisma.category.findFirst({
      where: {
        id: body.categoryId,
        enabled: true,
        deleted: false,
      },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'La categoría no existe o está deshabilitada.' },
        { status: 400 },
      );
    }


    const book = await prisma.$transaction(async (tx) => {
      const newBook = await tx.book.create({
        data: {
          title,
          author,
          totalCopies,
          isbn,
          description,
          categoryId: category.id,
          createdById: currentUser.id,
        },
        select: {
          id: true,
          title: true,
          author: true,
          isbn: true,
          description: true,
          totalCopies: true,
          enabled: true,
          categoryId: true,
          createdAt: true,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          type: 'INITIAL',
          quantity: totalCopies,
          bookId: newBook.id,
          userId: currentUser.id,
        },
      });

      return newBook;
    });


    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un libro con ese ISBN.' },
        { status: 409 },
      );
    }

    console.error('Error creating book:', error);

    return NextResponse.json(
      { error: 'No fue posible crear el libro.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
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
        { error: 'No tienes permisos para editar libros.' },
        { status: 403 },
      );
    }

    const body: unknown = await request.json();

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Los datos enviados no son válidos.' },
        { status: 400 },
      );
    }

    if (
      !('id' in body) ||
      typeof body.id !== 'string' ||
      !body.id.trim()
    ) {
      return NextResponse.json(
        { error: 'El identificador del libro no es válido.' },
        { status: 400 },
      );
    }

    if ('enabled' in body) {
      if (typeof body.enabled !== 'boolean') {
        return NextResponse.json(
          { error: 'El estado del libro no es válido.' },
          { status: 400 },
        );
      }

      const existingBook = await prisma.book.findFirst({
        where: {
          id: body.id,
          deleted: false,
        },
        select: {
          id: true,
        },
      });

      if (!existingBook) {
        return NextResponse.json(
          { error: 'El libro no existe o ha sido eliminado.' },
          { status: 404 },
        );
      }

      const book = await prisma.book.update({
        where: { id: existingBook.id },
        data: {
          enabled: body.enabled,
        },
        select: {
          id: true,
          title: true,
          enabled: true,
        },
      });

      return NextResponse.json({ book }, { status: 200 });
    }

    if (
      !('title' in body) ||
      typeof body.title !== 'string' ||
      !body.title.trim() ||
      body.title.trim().length > 200
    ) {
      return NextResponse.json(
        { error: 'El título es obligatorio y no puede superar los 200 caracteres.' },
        { status: 400 },
      );
    }

    if (
      !('author' in body) ||
      typeof body.author !== 'string' ||
      !body.author.trim() ||
      body.author.trim().length > 150
    ) {
      return NextResponse.json(
        { error: 'El autor es obligatorio y no puede superar los 150 caracteres.' },
        { status: 400 },
      );
    }

    if (
      !('categoryId' in body) ||
      typeof body.categoryId !== 'string' ||
      !body.categoryId.trim()
    ) {
      return NextResponse.json(
        { error: 'Debes seleccionar una categoría.' },
        { status: 400 },
      );
    }

    if ('totalCopies' in body) {
      return NextResponse.json(
        {
          error:
            'No puedes modificar la cantidad de ejemplares desde la edición del libro. Utiliza la sección de Transacciones.',
        },
        { status: 400 },
      );
    }

    let description: string | null = null;

    if (
      'description' in body &&
      body.description !== undefined &&
      body.description !== null
    ) {
      if (typeof body.description !== 'string') {
        return NextResponse.json(
          { error: 'La descripción debe ser un texto.' },
          { status: 400 },
        );
      }

      description = body.description.trim() || null;

      if (description && description.length > 2000) {
        return NextResponse.json(
          { error: 'La descripción no puede superar los 2000 caracteres.' },
          { status: 400 },
        );
      }
    }

    let isbn: string | null = null;

    if ('isbn' in body && body.isbn !== undefined && body.isbn !== null) {
      if (typeof body.isbn !== 'string') {
        return NextResponse.json(
          { error: 'El ISBN debe ser un texto.' },
          { status: 400 },
        );
      }

      isbn = body.isbn.trim() || null;

      if (isbn && isbn.length > 20) {
        return NextResponse.json(
          { error: 'El ISBN no puede superar los 20 caracteres.' },
          { status: 400 },
        );
      }
    }

    const existingBook = await prisma.book.findFirst({
      where: {
        id: body.id,
        deleted: false,
      },
      select: { id: true },
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: 'El libro no existe o ha sido eliminado.' },
        { status: 404 },
      );
    }

    const category = await prisma.category.findFirst({
      where: {
        id: body.categoryId,
        enabled: true,
        deleted: false,
      },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'La categoría no existe o está deshabilitada.' },
        { status: 400 },
      );
    }

    const book = await prisma.book.update({
      where: { id: existingBook.id },
      data: {
        title: body.title.trim(),
        author: body.author.trim(),
        isbn,
        description,
        categoryId: category.id,
      },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        description: true,
        totalCopies: true,
        enabled: true,
        categoryId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ book }, { status: 200 });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un libro con ese ISBN.' },
        { status: 409 },
      );
    }

    console.error('Error updating book:', error);

    return NextResponse.json(
      { error: 'No fue posible actualizar el libro.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
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
        { error: 'No tienes permisos para eliminar libros.' },
        { status: 403 },
      );
    }

    const body: unknown = await request.json();

    if (
      typeof body !== 'object' ||
      body === null ||
      !('id' in body) ||
      typeof body.id !== 'string' ||
      !body.id.trim()
    ) {
      return NextResponse.json(
        { error: 'El identificador del libro no es válido.' },
        { status: 400 },
      );
    }

    const existingBook = await prisma.book.findFirst({
      where: {
        id: body.id,
        deleted: false,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: 'El libro no existe o ya fue eliminado.' },
        { status: 404 },
      );
    }

    const activeLoanItem = await prisma.loanItem.findFirst({
      where: {
        bookId: existingBook.id,
        loan: {
          status: {
            in: ['REQUESTED', 'APPROVED'],
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (activeLoanItem) {
      return NextResponse.json(
        {
          error:
            'No se puede eliminar este libro porque tiene préstamos solicitados o aprobados.',
        },
        { status: 409 },
      );
    }

    await prisma.book.update({
      where: { id: existingBook.id },
      data: {
        deleted: true,
        enabled: false,
      },
    });

    return NextResponse.json(
      {
        message: `Libro "${existingBook.title}" eliminado correctamente.`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting book:', error);

    return NextResponse.json(
      { error: 'No fue posible eliminar el libro.' },
      { status: 500 },
    );
  }
}
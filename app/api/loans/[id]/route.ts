

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@/generated/prisma/client';
import { getBookAvailability, lockBookForInventory } from '@/lib/inventory';

const LOAN_DURATION_DAYS = 30;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
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
        { error: 'No tienes permisos para gestionar préstamos.' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body: unknown = await request.json();

    if (
      typeof body !== 'object' ||
      body === null ||
      !('action' in body) ||
      (body.action !== 'APPROVE' &&
        body.action !== 'REJECT' &&
        body.action !== 'RETURN')
    ) {
      return NextResponse.json(
        { error: 'La acción solicitada no es válida.' },
        { status: 400 },
      );
    }

    const loan = await prisma.$transaction(
      async (tx) => {
        const existingLoan = await tx.loan.findUnique({
          where: { id },
          include: {
            items: {
              include: {
                book: {
                  select: {
                    id: true,
                    title: true,
                    totalCopies: true,
                    enabled: true,
                    deleted: true,
                  },
                },
                inventoryMovements: {
                  select: {
                    type: true,
                  },
                },
              },
            },
          },
        });

        if (!existingLoan) {
          throw new Error('LOAN_NOT_FOUND');
        }

        // Bloquear los libros involucrados en orden para evitar
        // que otras transacciones modifiquen su inventario simultáneamente.
        const bookIds = [
          ...new Set(existingLoan.items.map((item) => item.bookId)),
        ].sort();

        for (const bookId of bookIds) {
          await lockBookForInventory(tx, bookId);
        }

        if (!existingLoan) {
          throw new Error('LOAN_NOT_FOUND');
        }

        // Rechazar una solicitud pendiente.
        if (body.action === 'REJECT') {
          if (existingLoan.status !== 'REQUESTED') {
            throw new Error('LOAN_ALREADY_PROCESSED');
          }

          return tx.loan.update({
            where: { id },
            data: { status: 'REJECTED' },
            select: {
              id: true,
              status: true,
              requestedAt: true,
              approvedAt: true,
              dueDate: true,
            },
          });
        }

        // Aprobar una solicitud y descontar el inventario.
        if (body.action === 'APPROVE') {
          if (existingLoan.status !== 'REQUESTED') {
            throw new Error('LOAN_ALREADY_PROCESSED');
          }

          for (const item of existingLoan.items) {
            if (!item.book.enabled || item.book.deleted) {
              throw new Error('BOOK_NOT_AVAILABLE');
            }

            const availableCopies = await getBookAvailability(
              tx,
              item.bookId,
            );

            if (item.quantity > availableCopies) {
              throw new Error(
                `INSUFFICIENT_STOCK:${item.book.title}:${availableCopies}`,
              );
            }
          }

          const approvedAt = new Date();
          const dueDate = new Date(approvedAt);

          dueDate.setDate(
            dueDate.getDate() + LOAN_DURATION_DAYS,
          );

          for (const item of existingLoan.items) {
            await tx.inventoryMovement.create({
              data: {
                type: 'EXIT',
                quantity: item.quantity,
                bookId: item.bookId,
                userId: currentUser.id,
                loanItemId: item.id,
              },
            });
          }

          return tx.loan.update({
            where: { id },
            data: {
              status: 'APPROVED',
              approvedAt,
              dueDate,
            },
            select: {
              id: true,
              status: true,
              requestedAt: true,
              approvedAt: true,
              dueDate: true,
            },
          });
        }

        // Registrar la devolución de los ejemplares pendientes.
        if (existingLoan.status !== 'APPROVED') {
          throw new Error('LOAN_NOT_RETURNABLE');
        }

        const pendingItems = existingLoan.items.filter(
          (item) => item.returnedAt === null,
        );

        if (pendingItems.length === 0) {
          throw new Error('LOAN_ALREADY_RETURNED');
        }

        for (const item of pendingItems) {
          const hasExitMovement = item.inventoryMovements.some(
            (movement) => movement.type === 'EXIT',
          );

          const hasEntryMovement = item.inventoryMovements.some(
            (movement) => movement.type === 'ENTRY',
          );

          if (!hasExitMovement || hasEntryMovement) {
            throw new Error('INVALID_RETURN_MOVEMENTS');
          }
        }

        const returnedAt = new Date();

        for (const item of pendingItems) {
          await tx.inventoryMovement.create({
            data: {
              type: 'ENTRY',
              quantity: item.quantity,
              bookId: item.bookId,
              userId: currentUser.id,
              loanItemId: item.id,
            },
          });

          await tx.loanItem.update({
            where: { id: item.id },
            data: { returnedAt },
          });
        }

        return tx.loan.update({
          where: { id },
          data: {
            status: 'RETURNED',
          },
          select: {
            id: true,
            status: true,
            requestedAt: true,
            approvedAt: true,
            dueDate: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    const messages = {
      APPROVE: 'El préstamo fue aprobado correctamente.',
      REJECT: 'La solicitud fue rechazada correctamente.',
      RETURN: 'La devolución fue registrada correctamente.',
    };

    return NextResponse.json(
      {
        message: messages[body.action],
        loan,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating loan:', error);

    if (error instanceof Error) {
      if (error.message === 'LOAN_NOT_FOUND') {
        return NextResponse.json(
          { error: 'No se encontró la solicitud de préstamo.' },
          { status: 404 },
        );
      }

      if (error.message === 'LOAN_ALREADY_PROCESSED') {
        return NextResponse.json(
          { error: 'Esta solicitud ya fue procesada.' },
          { status: 409 },
        );
      }

      if (error.message === 'BOOK_NOT_AVAILABLE') {
        return NextResponse.json(
          { error: 'Uno de los libros ya no está disponible.' },
          { status: 409 },
        );
      }

      if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
        const [, title, available] = error.message.split(':');

        return NextResponse.json(
          {
            error: `No hay suficientes ejemplares de "${title}". Disponibles: ${available}.`,
          },
          { status: 409 },
        );
      }

      if (error.message === 'LOAN_NOT_RETURNABLE') {
        return NextResponse.json(
          { error: 'Este préstamo no está en estado de devolución.' },
          { status: 409 },
        );
      }

      if (error.message === 'LOAN_ALREADY_RETURNED') {
        return NextResponse.json(
          { error: 'Todos los ejemplares de este préstamo ya fueron devueltos.' },
          { status: 409 },
        );
      }

      if (error.message === 'INVALID_RETURN_MOVEMENTS') {
        return NextResponse.json(
          {
            error:
              'No se puede registrar la devolución porque los movimientos del inventario no son consistentes.',
          },
          { status: 409 },
        );
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2034' || error.code === 'P2002')
    ) {
      return NextResponse.json(
        {
          error:
            'Hubo un conflicto al procesar el inventario. Intenta nuevamente.',
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: 'No fue posible actualizar la solicitud de préstamo.' },
      { status: 500 },
    );
  }
}

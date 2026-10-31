import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

type DatabaseClient = Prisma.TransactionClient | typeof prisma;
type TransactionClient = Prisma.TransactionClient;

/**
 * Calcula las existencias disponibles de un libro
 * utilizando su historial de movimientos.
 *
 * INITIAL y ENTRY suman existencias.
 * EXIT resta existencias.
 */
export async function getBookAvailability(
  tx: DatabaseClient,
  bookId: string,
): Promise<number> {
  const movements = await tx.inventoryMovement.groupBy({
    by: ['type'],
    where: {
      bookId,
    },
    _sum: {
      quantity: true,
    },
  });

  let availableCopies = 0;

  for (const movement of movements) {
    const quantity = movement._sum.quantity ?? 0;

    if (movement.type === 'INITIAL' || movement.type === 'ENTRY') {
      availableCopies += quantity;
    } else if (movement.type === 'EXIT') {
      availableCopies -= quantity;
    }
  }

  return availableCopies;
}

/**
 * Bloquea la fila de un libro durante la transacción actual.
 */
export async function lockBookForInventory(
  tx: TransactionClient,
  bookId: string,
): Promise<void> {
  await tx.$queryRaw`
    SELECT id
    FROM "Book"
    WHERE id = ${bookId}
    FOR UPDATE
  `;
}
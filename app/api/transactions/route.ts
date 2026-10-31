import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
    getBookAvailability,
    lockBookForInventory,
} from '@/lib/inventory';
import { Prisma } from '@/generated/prisma/client';



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
                totalCopies: true,
                enabled: true,
            },
            orderBy: {
                title: 'asc',
            },
        });

        const movements = await prisma.inventoryMovement.findMany({
            where: {
                book: {
                    deleted: false,
                    ...(currentUser.role === 'USER' && {
                        enabled: true,
                    }),
                },
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 100,
        });

        const booksWithAvailability = await Promise.all(
            books.map(async (book) => ({
                ...book,
                availableCopies: await getBookAvailability(
                    prisma,
                    book.id,
                ),
            })),
        );

        return NextResponse.json(
            {
                books: booksWithAvailability,
                movements,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Error fetching transactions:', error);

        return NextResponse.json(
            { error: 'No fue posible consultar las transacciones.' },
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

        const body: unknown = await request.json();

        if (
            typeof body !== 'object' ||
            body === null ||
            !('bookId' in body) ||
            typeof body.bookId !== 'string' ||
            !body.bookId.trim() ||
            !('type' in body) ||
            (body.type !== 'ENTRY' && body.type !== 'EXIT') ||
            !('quantity' in body) ||
            typeof body.quantity !== 'number' ||
            !Number.isSafeInteger(body.quantity) ||
            body.quantity < 1 ||
            body.quantity > 100000
        ) {
            return NextResponse.json(
                {
                    error:
                        'Debes proporcionar un libro, un tipo de movimiento válido y una cantidad entera entre 1 y 100000.',
                },
                { status: 400 },
            );
        }

        const { bookId, type, quantity } = body;

        const result = await prisma.$transaction(
            async (tx) => {
                await lockBookForInventory(tx, bookId);
                const book = await tx.book.findFirst({
                    where: {
                        id: bookId,
                        deleted: false,
                    },
                    select: {
                        id: true,
                        title: true,
                        totalCopies: true,
                        enabled: true,
                    },
                });

                if (!book) {
                    throw new Error('BOOK_NOT_FOUND');
                }

                if (!book.enabled) {
                    throw new Error('BOOK_DISABLED');
                }

                let availableCopies: number;

                if (type === 'EXIT') {
                    availableCopies = await getBookAvailability(
                        tx,
                        book.id,
                    );

                    if (quantity > availableCopies) {
                        throw new Error(
                            `INSUFFICIENT_STOCK:${availableCopies}`,
                        );
                    }

                    await tx.book.update({
                        where: { id: book.id },
                        data: {
                            totalCopies: {
                                decrement: quantity,
                            },
                        },
                    });
                } else {
                    await tx.book.update({
                        where: { id: book.id },
                        data: {
                            totalCopies: {
                                increment: quantity,
                            },
                        },
                    });

                    availableCopies = await getBookAvailability(
                        tx,
                        book.id,
                    ) + quantity;
                }

                const movement = await tx.inventoryMovement.create({
                    data: {
                        type,
                        quantity,
                        bookId: book.id,
                        userId: currentUser.id,
                    },
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                lastName: true,
                            },
                        },
                    },
                });

                return {
                    movement,
                    availableCopies:
                        type === 'ENTRY'
                            ? availableCopies
                            : availableCopies - quantity,
                    totalCopies:
                        type === 'ENTRY'
                            ? book.totalCopies + quantity
                            : book.totalCopies - quantity,
                };
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            },
        );

        return NextResponse.json(
            {
                message:
                    type === 'ENTRY'
                        ? 'La entrada de ejemplares fue registrada correctamente.'
                        : 'La salida de ejemplares fue registrada correctamente.',
                ...result,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Error creating transaction:', error);

        if (error instanceof Error) {
            if (error.message === 'BOOK_NOT_FOUND') {
                return NextResponse.json(
                    { error: 'El libro no existe o fue eliminado.' },
                    { status: 404 },
                );
            }

            if (error.message === 'BOOK_DISABLED') {
                return NextResponse.json(
                    { error: 'No puedes registrar movimientos para un libro deshabilitado.' },
                    { status: 409 },
                );
            }

            if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
                const available = error.message.split(':')[1];

                return NextResponse.json(
                    {
                        error: `No hay suficientes ejemplares disponibles. Disponibles: ${available}.`,
                    },
                    { status: 409 },
                );
            }
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2034'
        ) {
            return NextResponse.json(
                {
                    error:
                        'Hubo un conflicto al actualizar el inventario. Intenta nuevamente.',
                },
                { status: 409 },
            );
        }

        return NextResponse.json(
            { error: 'No fue posible registrar el movimiento.' },
            { status: 500 },
        );
    }
}

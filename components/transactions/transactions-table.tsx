
'use client';

import * as React from 'react';
import { toast } from 'sonner';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Movement = {
    id: string;
    type: 'INITIAL' | 'ENTRY' | 'EXIT';
    quantity: number;
    createdAt: string;
    book: {
        id: string;
        title: string;
    };
    user: {
        id: string;
        name: string;
        lastName: string | null;
    };
};

export function TransactionsTable() {
    const [movements, setMovements] = React.useState<Movement[]>([]);
    const [loading, setLoading] = React.useState(true);


    React.useEffect(() => {
        let cancelled = false;

        async function loadMovements() {
            try {
                const response = await fetch('/api/transactions', {
                    cache: 'no-store',
                });
                const result: unknown = await response.json();

                if (!response.ok) {
                    const message =
                        typeof result === 'object' &&
                            result !== null &&
                            'error' in result &&
                            typeof result.error === 'string'
                            ? result.error
                            : 'No fue posible consultar los movimientos.';

                    throw new Error(message);
                }

                if (
                    typeof result !== 'object' ||
                    result === null ||
                    !('movements' in result) ||
                    !Array.isArray(result.movements)
                ) {
                    throw new Error('La respuesta de movimientos no es válida.');
                }

                const validMovements = result.movements.filter(
                    (item): item is Movement =>
                        typeof item === 'object' &&
                        item !== null &&
                        'id' in item &&
                        typeof item.id === 'string' &&
                        'type' in item &&
                        (item.type === 'INITIAL' ||
                            item.type === 'ENTRY' ||
                            item.type === 'EXIT') &&
                        'quantity' in item &&
                        typeof item.quantity === 'number' &&
                        'createdAt' in item &&
                        typeof item.createdAt === 'string' &&
                        'book' in item &&
                        typeof item.book === 'object' &&
                        item.book !== null &&
                        'id' in item.book &&
                        typeof item.book.id === 'string' &&
                        'title' in item.book &&
                        typeof item.book.title === 'string' &&
                        'user' in item &&
                        typeof item.user === 'object' &&
                        item.user !== null &&
                        'id' in item.user &&
                        typeof item.user.id === 'string' &&
                        'name' in item.user &&
                        typeof item.user.name === 'string' &&
                        'lastName' in item.user &&
                        (typeof item.user.lastName === 'string' ||
                            item.user.lastName === null),
                );

                if (!cancelled) {
                    setMovements(validMovements);
                }
            } catch (error) {
                if (!cancelled) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : 'Ocurrió un error al consultar los movimientos.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        function handleTransactionsUpdate() {
            void loadMovements();
        }

        void loadMovements();

        window.addEventListener(
            'transactions-updated',
            handleTransactionsUpdate,
        );

        return () => {
            cancelled = true;
            window.removeEventListener(
                'transactions-updated',
                handleTransactionsUpdate,
            );
        };
    }, []);

    function formatDate(date: string) {
        return new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(date));
    }

    function getMovementLabel(type: Movement['type']) {
        switch (type) {
            case 'INITIAL':
                return 'Inventario inicial';
            case 'ENTRY':
                return 'Entrada';
            case 'EXIT':
                return 'Salida';
        }
    }

    if (loading) {
        return (
            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                Cargando movimientos...
            </div>
        );
    }

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">
                    Historial de movimientos
                </h2>
                <p className="text-sm text-muted-foreground">
                    Consulta las últimas entradas y salidas del inventario.
                </p>
            </div>

            {movements.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                    <p className="font-medium">
                        Todavía no hay movimientos registrados.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Cuando se registren entradas o salidas, aparecerán aquí.
                    </p>
                </div>
            ) : (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Libro</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">
                                    Cantidad
                                </TableHead>
                                <TableHead>Responsable</TableHead>
                                <TableHead>Fecha</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {movements.map((movement) => (
                                <TableRow key={movement.id}>
                                    <TableCell className="font-mono text-xs">
                                        {movement.id.slice(-8)}
                                    </TableCell>

                                    <TableCell className="font-medium">
                                        {movement.book.title}
                                    </TableCell>

                                    <TableCell>
                                        <span
                                            className={
                                                movement.type === 'EXIT'
                                                    ? 'rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300'
                                                    : movement.type === 'ENTRY'
                                                        ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300'
                                                        : 'rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                            }
                                        >
                                            {getMovementLabel(movement.type)}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-right font-medium">
                                        {movement.quantity}
                                    </TableCell>

                                    <TableCell>
                                        {movement.user.name}{' '}
                                        {movement.user.lastName ?? ''}
                                    </TableCell>

                                    <TableCell className="text-muted-foreground">
                                        {formatDate(movement.createdAt)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </section>
    );
}

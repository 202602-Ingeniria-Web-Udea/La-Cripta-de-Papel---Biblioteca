
'use client';

import * as React from 'react';
import { toast } from 'sonner';

type Book = {
    id: string;
    title: string;
    author: string;
    totalCopies: number;
    availableCopies: number;
    enabled: boolean;
};

type TransactionsResponse = {
    books: Book[];
};

export function InventorySummary() {
    const [books, setBooks] = React.useState<Book[]>([]);
    const [loading, setLoading] = React.useState(true);

React.useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
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
                        : 'No fue posible consultar el inventario.';

                throw new Error(message);
            }

            if (
                typeof result !== 'object' ||
                result === null ||
                !('books' in result) ||
                !Array.isArray(result.books)
            ) {
                throw new Error('La respuesta del inventario no es válida.');
            }

            const inventory = result.books.filter(
                (item): item is Book =>
                    typeof item === 'object' &&
                    item !== null &&
                    'id' in item &&
                    typeof item.id === 'string' &&
                    'title' in item &&
                    typeof item.title === 'string' &&
                    'author' in item &&
                    typeof item.author === 'string' &&
                    'totalCopies' in item &&
                    typeof item.totalCopies === 'number' &&
                    'availableCopies' in item &&
                    typeof item.availableCopies === 'number' &&
                    'enabled' in item &&
                    typeof item.enabled === 'boolean',
            );

            if (!cancelled) {
                setBooks(inventory);
            }
        } catch (error) {
            if (!cancelled) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : 'Ocurrió un error al consultar el inventario.',
                );
            }
        } finally {
            if (!cancelled) {
                setLoading(false);
            }
        }
    }

    function handleInventoryUpdate() {
        void loadInventory();
    }

    void loadInventory();

    window.addEventListener(
        'transactions-updated',
        handleInventoryUpdate,
    );

    return () => {
        cancelled = true;
        window.removeEventListener(
            'transactions-updated',
            handleInventoryUpdate,
        );
    };
}, []);

    const totalBooks = books.length;

    const totalCopies = books.reduce(
        (total, book) => total + book.totalCopies,
        0,
    );

    const availableCopies = books.reduce(
        (total, book) => total + book.availableCopies,
        0,
    );

    const summary = [
        {
            label: 'Libros registrados',
            value: totalBooks,
        },
        {
            label: 'Ejemplares físicos',
            value: totalCopies,
        },
        {
            label: 'Ejemplares disponibles',
            value: availableCopies,
        },
    ];

    return (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map((item) => (
                <article key={item.label} className="rounded-lg border p-5">
                    <p className="text-sm text-muted-foreground">
                        {item.label}
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                        {loading ? '—' : item.value.toLocaleString('es-CO')}
                    </p>
                </article>
            ))}
        </section>
    );
}

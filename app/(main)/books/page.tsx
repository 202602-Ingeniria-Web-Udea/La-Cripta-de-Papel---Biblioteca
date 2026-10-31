import { IconBook } from '@tabler/icons-react';

import { prisma } from '@/lib/prisma';
import { BookDialog } from '@/components/books/dialog';
import { BookToggleStatus } from '@/components/books/toggle-status';
import { DeleteBook } from '@/components/books/delete-book';

export default async function BooksPage() {
    const books = await prisma.book.findMany({
        where: {
            deleted: false,
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
        },
        orderBy: {
            title: 'asc',
        },
    });

    return (
        <main className="space-y-6 p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Catálogo de libros
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Administra los libros de la Biblioteca del Terror.
                    </p>
                </div>

                <BookDialog />
            </header>

            {books.length === 0 ? (
                <section className="rounded-lg border p-8 text-center">
                    <IconBook className="mx-auto size-12 text-muted-foreground" />

                    <h2 className="mt-4 text-lg font-semibold">
                        Tu catálogo está listo para comenzar
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Aquí aparecerán los libros registrados en la biblioteca.
                    </p>
                </section>
            ) : (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {books.map((book) => (
                        <article
                            key={book.id}
                            className="rounded-lg border p-5"

                        >
                            <div className="flex items-start gap-3">
                                <IconBook className="mt-1 size-5 shrink-0 text-muted-foreground" />

                                <div className="min-w-0 flex-1">
                                    <h2 className="font-semibold">{book.title}</h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {book.author}
                                    </p>

                                    <p className="mt-3 text-sm">
                                        Categoría: {book.category.name}
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Ejemplares: {book.totalCopies}
                                    </p>

                                    {book.isbn && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            ISBN: {book.isbn}
                                        </p>
                                    )}

                                    {!book.enabled && (
                                        <p className="mt-3 text-xs text-amber-700">
                                            Libro deshabilitado
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                <BookDialog
                                    book={{
                                        id: book.id,
                                        title: book.title,
                                        author: book.author,
                                        isbn: book.isbn,
                                        description: book.description,
                                        totalCopies: book.totalCopies,
                                        categoryId: book.categoryId,
                                        enabled: book.enabled,
                                    }}
                                />

                                <BookToggleStatus
                                    id={book.id}
                                    title={book.title}
                                    enabled={book.enabled}
                                />

                                <DeleteBook
                                    id={book.id}
                                    title={book.title}
                                />
                            </div>

                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}

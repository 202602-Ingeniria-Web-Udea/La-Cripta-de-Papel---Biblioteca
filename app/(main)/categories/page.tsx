import { IconCategory } from '@tabler/icons-react';

import { CategoryDialog } from '@/components/categories/dialog';
import { prisma } from '@/lib/prisma';
import { CategoryToggleStatus } from '@/components/categories/toggle-status';
import { DeleteCategory } from '@/components/categories/delete-category';

export default async function CategoriesPage() {
    const categories = await prisma.category.findMany({
        where: {
            deleted: false,
        },
        select: {
            id: true,
            name: true,
            description: true,
            enabled: true,
            createdAt: true,
        },
        orderBy: {
            name: 'asc',
        },
    });

    return (
        <main className="space-y-6 p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Categorías
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Organiza los libros por género o temática.
                    </p>
                </div>

                <CategoryDialog />
            </header>

            {categories.length === 0 ? (
                <section className="rounded-lg border p-8 text-center">
                    <IconCategory className="mx-auto size-12 text-muted-foreground" />

                    <h2 className="mt-4 text-lg font-semibold">
                        Aún no hay categorías para mostrar
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Las categorías que registres aparecerán aquí.
                    </p>
                </section>
            ) : (

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <article
                            key={category.id}
                            className="rounded-lg border p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                    <IconCategory className="mt-1 size-5 shrink-0 text-muted-foreground" />

                                    <div className="min-w-0">
                                        <h2 className="font-semibold">{category.name}</h2>

                                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                                            {category.description || 'Sin descripción.'}
                                        </p>

                                        {!category.enabled && (
                                            <p className="mt-3 text-xs text-amber-700">
                                                Categoría deshabilitada
                                            </p>
                                        )}
                                    </div>
                                </div>


                                <div className="flex flex-wrap gap-2">
                                    <CategoryDialog
                                        category={{
                                            id: category.id,
                                            name: category.name,
                                            description: category.description,
                                            enabled: category.enabled,
                                        }}
                                    />

                                    <CategoryToggleStatus
                                        id={category.id}
                                        name={category.name}
                                        enabled={category.enabled}
                                    />

                                    <DeleteCategory
                                        id={category.id}
                                        name={category.name}
                                    />
                                </div>

                            </div>
                        </article>
                    ))}
                </section>

            )}
        </main>
    );
}

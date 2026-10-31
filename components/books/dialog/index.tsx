
'use client';

import * as React from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';

const formSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'El título es obligatorio.')
        .max(200, 'El título no puede superar los 200 caracteres.'),
    author: z
        .string()
        .trim()
        .min(1, 'El autor es obligatorio.')
        .max(150, 'El autor no puede superar los 150 caracteres.'),
    isbn: z
        .string()
        .max(20, 'El ISBN no puede superar los 20 caracteres.'),
    description: z
        .string()
        .max(2000, 'La descripción no puede superar los 2000 caracteres.'),
    totalCopies: z
        .number()
        .int('La cantidad debe ser un número entero.')
        .min(1, 'Debe haber al menos un ejemplar.')
        .max(100000, 'La cantidad no puede superar los 100000 ejemplares.'),
    categoryId: z
        .string()
        .min(1, 'Debes seleccionar una categoría.'),
});

type FormValues = z.infer<typeof formSchema>;

type CategoryOption = {
    id: string;
    name: string;
};


type BookToEdit = {
    id: string;
    title: string;
    author: string;
    isbn: string | null;
    description: string | null;
    totalCopies: number;
    categoryId: string;
    enabled: boolean;
};


export function BookDialog({ book }: { book?: BookToEdit }) {
    const [categories, setCategories] = React.useState<CategoryOption[]>([]);
    const [loadingCategories, setLoadingCategories] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: book?.title ?? '',
            author: book?.author ?? '',
            isbn: book?.isbn ?? '',
            description: book?.description ?? '',
            totalCopies: book?.totalCopies ?? 1,
            categoryId: book?.categoryId ?? '',
        },
    });

    React.useEffect(() => {
        if (!open) return;

        let cancelled = false;

        async function loadCategories() {
            setLoadingCategories(true);

            try {
                const response = await fetch('/api/categories');
                const result: unknown = await response.json();

                if (!response.ok) {
                    const message =
                        typeof result === 'object' &&
                            result !== null &&
                            'error' in result &&
                            typeof result.error === 'string'
                            ? result.error
                            : 'No fue posible cargar las categorías.';

                    throw new Error(message);
                }

                if (
                    typeof result !== 'object' ||
                    result === null ||
                    !('categories' in result) ||
                    !Array.isArray(result.categories)
                ) {
                    throw new Error('La respuesta de categorías no es válida.');
                }

                const options = result.categories.filter(
                    (item): item is CategoryOption =>
                        typeof item === 'object' &&
                        item !== null &&
                        'id' in item &&
                        typeof item.id === 'string' &&
                        'name' in item &&
                        typeof item.name === 'string',
                );

                if (!cancelled) {
                    setCategories(options);
                }
            } catch (error) {
                if (!cancelled) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : 'Ocurrió un error al cargar las categorías.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingCategories(false);
                }
            }
        }

        void loadCategories();

        return () => {
            cancelled = true;
        };
    }, [open]);

    async function onSubmit(data: FormValues) {
        setLoading(true);

        try {
            const { totalCopies, ...bookData } = data;

            const response = await fetch('/api/books', {
                method: book ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(book ? { id: book.id } : {}),
                    ...(book ? bookData : data),
                    ...{
                        isbn: data.isbn.trim() || null,
                        description: data.description.trim() || null,
                    },
                }),
            });

            const result: unknown = await response.json();

            if (!response.ok) {
                const message =
                    typeof result === 'object' &&
                        result !== null &&
                        'error' in result &&
                        typeof result.error === 'string'
                        ? result.error
                        : 'No fue posible registrar el libro.';

                throw new Error(message);
            }

            toast.success(
                book
                    ? 'Libro actualizado correctamente.'
                    : 'Libro registrado correctamente.',
            );

            form.reset();
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Ocurrió un error inesperado.',
            );
        } finally {
            setLoading(false);
        }
    }

    function handleOpenChange(nextOpen: boolean) {
        if (loading) return;

        if (nextOpen) {
            form.reset({
                title: book?.title ?? '',
                author: book?.author ?? '',
                isbn: book?.isbn ?? '',
                description: book?.description ?? '',
                totalCopies: book?.totalCopies ?? 1,
                categoryId: book?.categoryId ?? '',
            });
        }

        setOpen(nextOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger render={<Button type="button" variant={book ? 'outline' : 'default'} />}>
                {book ? 'Editar' : 'Agregar libro'}
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{book ? 'Editar libro' : 'Registrar libro'}</DialogTitle>
                    <DialogDescription>
                        {book
                            ? 'Modifica los datos del libro y guarda los cambios.'
                            : 'Completa los datos del libro y selecciona su categoría.'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="book-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <FieldGroup>
                        <Controller
                            name="title"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="book-title">Título</FieldLabel>
                                    <Input
                                        {...field}
                                        id="book-title"
                                        placeholder="Ej. Drácula"
                                        maxLength={200}
                                        disabled={loading}
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="author"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="book-author">Autor</FieldLabel>
                                    <Input
                                        {...field}
                                        id="book-author"
                                        placeholder="Ej. Bram Stoker"
                                        maxLength={150}
                                        disabled={loading}
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="categoryId"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="book-category">
                                        Categoría
                                    </FieldLabel>
                                    <select
                                        {...field}
                                        id="book-category"
                                        disabled={loading || loadingCategories}
                                        aria-invalid={fieldState.invalid}
                                        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">
                                            {loadingCategories
                                                ? 'Cargando categorías...'
                                                : 'Selecciona una categoría'}
                                        </option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                    {!loadingCategories && categories.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Primero debes crear una categoría habilitada.
                                        </p>
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="isbn"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="book-isbn">ISBN (opcional)</FieldLabel>
                                    <Input
                                        {...field}
                                        id="book-isbn"
                                        placeholder="Ej. 9788497593793"
                                        maxLength={20}
                                        disabled={loading}
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        {!book && (
                            <Controller
                                name="totalCopies"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="book-copies">
                                            Cantidad de ejemplares
                                        </FieldLabel>

                                        <Input
                                            id="book-copies"
                                            type="number"
                                            min={1}
                                            max={100000}
                                            step={1}
                                            value={Number.isNaN(field.value) ? '' : field.value}
                                            onChange={(event) =>
                                                field.onChange(
                                                    event.target.value === ''
                                                        ? Number.NaN
                                                        : Number(event.target.value)
                                                )
                                            }
                                            disabled={loading}
                                            aria-invalid={fieldState.invalid}
                                        />

                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        )}

                        <Controller
                            name="description"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="book-description">
                                        Descripción (opcional)
                                    </FieldLabel>
                                    <Textarea
                                        {...field}
                                        id="book-description"
                                        placeholder="Una breve descripción del libro."
                                        maxLength={2000}
                                        rows={3}
                                        disabled={loading}
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </form>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={() =>
                            form.reset({
                                title: book?.title ?? '',
                                author: book?.author ?? '',
                                isbn: book?.isbn ?? '',
                                description: book?.description ?? '',
                                totalCopies: book?.totalCopies ?? 1,
                                categoryId: book?.categoryId ?? '',
                            })
                        }
                    >
                        Limpiar
                    </Button>

                    <Button
                        type="submit"
                        form="book-form"
                        disabled={loading || loadingCategories || categories.length === 0}
                    >
                        {loading ? (
                            <>
                                <Spinner className="size-4" />
                                Guardando...
                            </>
                        ) : (
                            book ? 'Guardar cambios' : 'Registrar libro'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

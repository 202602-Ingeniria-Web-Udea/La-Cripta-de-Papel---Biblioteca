
'use client';

import * as React from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
import { Spinner } from '@/components/ui/spinner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
    bookId: z.string().min(1, 'Debes seleccionar un libro.'),
    quantity: z
        .number()
        .int('La cantidad debe ser un número entero.')
        .min(1, 'Debes solicitar al menos un ejemplar.')
        .max(100000, 'La cantidad no puede superar 100000 ejemplares.'),
});

type FormValues = z.infer<typeof formSchema>;

type BookOption = {
    id: string;
    title: string;
    author: string;
    totalCopies: number;
    availableCopies: number;
    enabled: boolean;
};

export function LoanDialog() {
    const [books, setBooks] = React.useState<BookOption[]>([]);
    const [loadingBooks, setLoadingBooks] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [open, setOpen] = React.useState(false);

    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bookId: '',
            quantity: 1,
        },
    });

    const selectedBookId = useWatch({
        control: form.control,
        name: 'bookId',
    });

    const selectedBook = books.find(
        (book) => book.id === selectedBookId,
    );

    React.useEffect(() => {
        if (!open) return;

        let cancelled = false;

        async function loadBooks() {
            setLoadingBooks(true);

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
                            : 'No fue posible cargar los libros.';

                    throw new Error(message);
                }

                if (
                    typeof result !== 'object' ||
                    result === null ||
                    !('books' in result) ||
                    !Array.isArray(result.books)
                ) {
                    throw new Error('La respuesta de libros no es válida.');
                }

                const options = result.books.filter(
                    (item): item is BookOption =>
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
                        item.availableCopies > 0 &&
                        'enabled' in item &&
                        item.enabled === true,
                );

                if (!cancelled) {
                    setBooks(options);
                }
            } catch (error) {
                if (!cancelled) {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : 'Ocurrió un error al cargar los libros.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingBooks(false);
                }
            }
        }

        void loadBooks();

        return () => {
            cancelled = true;
        };
    }, [open]);

    async function onSubmit(data: FormValues) {
        setLoading(true);

        try {
            const response = await fetch('/api/loans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: [
                        {
                            bookId: data.bookId,
                            quantity: data.quantity,
                        },
                    ],
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
                        : 'No fue posible solicitar el préstamo.';

                throw new Error(message);
            }

            toast.success('Solicitud de préstamo enviada correctamente.');

            form.reset({
                bookId: '',
                quantity: 1,
            });

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
                bookId: '',
                quantity: 1,
            });
        }

        setOpen(nextOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={<Button type="button" />}
            >
                Solicitar préstamo
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Solicitar préstamo</DialogTitle>
                    <DialogDescription>
                        Selecciona el libro y la cantidad de ejemplares
                        que deseas solicitar.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="loan-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <FieldGroup>
                        <Controller
                            name="bookId"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel>Libro</FieldLabel>

                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={loading || loadingBooks}
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                            aria-invalid={fieldState.invalid}
                                        >
                                            <SelectValue
                                                placeholder={
                                                    loadingBooks
                                                        ? 'Cargando libros...'
                                                        : 'Selecciona un libro'
                                                }
                                            />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {books.map((book) => (
                                                <SelectItem
                                                    key={book.id}
                                                    value={book.id}
                                                >
                                                    {book.title} — {book.author}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}

                                    {!loadingBooks && books.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            No hay libros con ejemplares disponibles.
                                        </p>
                                    )}
                                </Field>
                            )}
                        />

                        {selectedBook && (
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <p className="text-sm font-medium">
                                    Disponibilidad del libro
                                </p>

                                <div className="mt-2 grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Ejemplares físicos
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {selectedBook.totalCopies}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Disponibles
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {selectedBook.availableCopies}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Controller
                            name="quantity"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="loan-quantity">
                                        Cantidad de ejemplares
                                    </FieldLabel>

                                    <Input
                                        id="loan-quantity"
                                        type="number"
                                        min={1}
                                        max={selectedBook?.availableCopies ?? 100000}
                                        step={1}
                                        value={
                                            Number.isNaN(field.value)
                                                ? ''
                                                : field.value
                                        }
                                        onChange={(event) =>
                                            field.onChange(
                                                event.target.value === ''
                                                    ? Number.NaN
                                                    : Number(event.target.value),
                                            )
                                        }
                                        disabled={loading}
                                        aria-invalid={fieldState.invalid}
                                    />

                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}

                                    {selectedBook && (
                                        <p className="text-xs text-muted-foreground">
                                            Puedes solicitar hasta{' '}
                                            {selectedBook.availableCopies}{' '}
                                            ejemplares.
                                        </p>
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
                        onClick={() => form.reset()}
                    >
                        Limpiar
                    </Button>

                    <Button
                        type="submit"
                        form="loan-form"
                        disabled={
                            loading ||
                            loadingBooks ||
                            books.length === 0
                        }
                    >
                        {loading ? (
                            <>
                                <Spinner className="size-4" />
                                Enviando...
                            </>
                        ) : (
                            'Enviar solicitud'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

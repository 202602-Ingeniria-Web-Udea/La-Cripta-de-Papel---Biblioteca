
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
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(100, 'El nombre no puede superar los 100 caracteres.'),
  description: z
    .string()
    .max(500, 'La descripción no puede superar los 500 caracteres.'),
});

type FormValues = z.infer<typeof formSchema>;

type CategoryData = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
};

type CategoryDialogProps = {
  category?: CategoryData;
};

export function CategoryDialog({ category }: CategoryDialogProps) {
  const isEditing = Boolean(category);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
    },
  });

  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  async function onSubmit(data: FormValues) {
    setLoading(true);

    try {
      const response = await fetch('/api/categories', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          isEditing
            ? { id: category!.id, ...data }
            : data,
        ),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          typeof result.error === 'string'
            ? result.error
            : `No fue posible ${isEditing ? 'actualizar' : 'crear'} la categoría.`;

        throw new Error(message);
      }

      toast.success(
        isEditing
          ? 'Categoría actualizada correctamente.'
          : 'Categoría creada correctamente.',
      );

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

    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset({
        name: category?.name ?? '',
        description: category?.description ?? '',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" variant={isEditing ? 'outline' : 'default'} />
        }
      >
        {isEditing ? 'Editar' : 'Agregar categoría'}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar categoría' : 'Crear categoría'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza el nombre o la descripción de esta categoría.'
              : 'Registra una categoría para organizar los libros de la biblioteca.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="category-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category-name">
                    Nombre
                  </FieldLabel>
                  <Input
                    {...field}
                    id="category-name"
                    placeholder="Ej. Terror psicológico"
                    aria-invalid={fieldState.invalid}
                    disabled={loading}
                    maxLength={100}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category-description">
                    Descripción (opcional)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="category-description"
                    placeholder="Describe brevemente esta categoría."
                    aria-invalid={fieldState.invalid}
                    disabled={loading}
                    maxLength={500}
                    rows={4}
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
                name: category?.name ?? '',
                description: category?.description ?? '',
              })
            }
          >
            Restaurar
          </Button>

          <Button
            type="submit"
            form="category-form"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="size-4" />
                Guardando...
              </>
            ) : isEditing ? (
              'Guardar cambios'
            ) : (
              'Crear categoría'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

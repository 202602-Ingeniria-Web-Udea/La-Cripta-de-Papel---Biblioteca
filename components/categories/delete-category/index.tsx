
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconTrash } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type DeleteCategoryProps = {
  id: string;
  name: string;
};

export function DeleteCategory({ id, name }: DeleteCategoryProps) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar la categoría "${name}"? Esta acción la ocultará del catálogo, pero conservará su registro en la base de datos.`,
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          deleted: true,
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
            : 'No fue posible eliminar la categoría.';

        throw new Error(message);
      }

      toast.success('Categoría eliminada correctamente.');
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

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={loading}
      onClick={handleDelete}
      aria-label={`Eliminar categoría ${name}`}
    >
      {loading ? (
        <>
          <Spinner className="size-4" />
          Eliminando...
        </>
      ) : (
        <>
          <IconTrash className="size-4" />
          Eliminar
        </>
      )}
    </Button>
  );
}

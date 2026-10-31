
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type DeleteBookProps = {
  id: string;
  title: string;
};

export function DeleteBook({ id, title }: DeleteBookProps) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el libro "${title}"? Esta acción lo retirará del catálogo.`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch('/api/books', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          typeof result.error === 'string'
            ? result.error
            : 'No fue posible eliminar el libro.';

        throw new Error(message);
      }

      toast.success(`Libro "${title}" eliminado correctamente.`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.'
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
    >
      {loading ? (
        <>
          <Spinner className="size-4" />
          Eliminando...
        </>
      ) : (
        'Eliminar'
      )}
    </Button>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type BookToggleStatusProps = {
  id: string;
  title: string;
  enabled: boolean;
};

export function BookToggleStatus({
  id,
  title,
  enabled,
}: BookToggleStatusProps) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);

    try {
      const response = await fetch('/api/books', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          enabled: !enabled,
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
            : 'No fue posible cambiar el estado del libro.';

        throw new Error(message);
      }

      toast.success(
        enabled
          ? `Libro "${title}" deshabilitado correctamente.`
          : `Libro "${title}" habilitado correctamente.`,
      );

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
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={handleToggle}
    >
      {loading ? (
        <>
          <Spinner className="size-4" />
          Procesando...
        </>
      ) : enabled ? (
        'Deshabilitar'
      ) : (
        'Habilitar'
      )}
    </Button>
  );
}

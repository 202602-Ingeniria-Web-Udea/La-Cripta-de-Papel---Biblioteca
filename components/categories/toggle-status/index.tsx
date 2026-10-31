'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type CategoryToggleStatusProps = {
  id: string;
  name: string;
  enabled: boolean;
};

export function CategoryToggleStatus({
  id,
  name,
  enabled,
}: CategoryToggleStatusProps) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);

    try {
      const response = await fetch('/api/categories', {
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
            : 'No fue posible actualizar el estado de la categoría.';

        throw new Error(message);
      }

      toast.success(
        enabled
          ? 'Categoría deshabilitada correctamente.'
          : 'Categoría habilitada correctamente.',
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
      aria-label={`${enabled ? 'Deshabilitar' : 'Habilitar'} categoría ${name}`}
    >
      {loading ? (
        <>
          <Spinner className="size-4" />
          Actualizando...
        </>
      ) : enabled ? (
        'Deshabilitar'
      ) : (
        'Habilitar'
      )}
    </Button>
  );
}

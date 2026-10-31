
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type LoanAction = 'APPROVE' | 'REJECT' | 'RETURN';

type LoanActionsProps = {
    loanId: string;
    status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RETURNED';
};

export function LoanActions({ loanId, status }: LoanActionsProps) {
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();

    async function handleAction(action: LoanAction) {
        const confirmations: Record<LoanAction, string> = {
            APPROVE: '¿Deseas aprobar esta solicitud de préstamo?',
            REJECT: '¿Deseas rechazar esta solicitud de préstamo?',
            RETURN: '¿Confirmas que todos los ejemplares pendientes de este préstamo fueron devueltos?',
        };

        if (!window.confirm(confirmations[action])) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/loans/${loanId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action }),
            });

            const result: unknown = await response.json();

            if (!response.ok) {
                const message =
                    typeof result === 'object' &&
                    result !== null &&
                    'error' in result &&
                    typeof result.error === 'string'
                        ? result.error
                        : 'No fue posible actualizar el préstamo.';

                throw new Error(message);
            }

            const messages: Record<LoanAction, string> = {
                APPROVE: 'Préstamo aprobado correctamente.',
                REJECT: 'Solicitud rechazada correctamente.',
                RETURN: 'Devolución registrada correctamente.',
            };

            toast.success(messages[action]);

            window.dispatchEvent(new Event('transactions-updated'));

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

    if (status === 'REJECTED' || status === 'RETURNED') {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {status === 'REQUESTED' && (
                <>
                    <Button
                        size="sm"
                        disabled={loading}
                        onClick={() => handleAction('APPROVE')}
                    >
                        {loading ? (
                            <Spinner className="size-4" />
                        ) : (
                            'Aprobar'
                        )}
                    </Button>

                    <Button
                        size="sm"
                        variant="destructive"
                        disabled={loading}
                        onClick={() => handleAction('REJECT')}
                    >
                        Rechazar
                    </Button>
                </>
            )}

            {status === 'APPROVED' && (
                <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleAction('RETURN')}
                >
                    {loading ? (
                        <>
                            <Spinner className="size-4" />
                            Procesando...
                        </>
                    ) : (
                        'Registrar devolución'
                    )}
                </Button>
            )}
        </div>
    );
}

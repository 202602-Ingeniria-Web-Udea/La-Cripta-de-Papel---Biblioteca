
import { InventorySummary } from '@/components/transactions/inventory-summary';
import { TransactionsTable } from '@/components/transactions/transactions-table';
import { TransactionDialog } from '@/components/transactions/transaction-dialog';

export default function TransactionsPage() {
    return (
        <main className="space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Transacciones
                    </h1>

                    <p className="mt-2 text-muted-foreground">
                        Consulta y administra las entradas y salidas de ejemplares
                        de la Biblioteca del Terror.
                    </p>
                </div>

                <TransactionDialog />
            </header>

            <InventorySummary />

            <TransactionsTable />
        </main>
    );
}

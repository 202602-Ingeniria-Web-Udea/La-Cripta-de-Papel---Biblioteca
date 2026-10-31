
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LoansTable } from '@/components/loans/loans-table';
import { LoanDialog } from '@/components/loans/loan-dialog';

export default async function LoansPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    const loans = await prisma.loan.findMany({
        where:
            currentUser.role === 'ADMIN'
                ? {}
                : { userId: currentUser.id },
        select: {
            id: true,
            status: true,
            requestedAt: true,
            approvedAt: true,
            dueDate: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    lastName: true,
                    email: true,
                },
            },
            items: {
                select: {
                    id: true,
                    quantity: true,
                    returnedAt: true,
                    book: {
                        select: {
                            id: true,
                            title: true,
                            author: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            requestedAt: 'desc',
        },
    });

    return (
        <main className="space-y-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Préstamos
                    </h1>

                    <p className="mt-2 text-muted-foreground">
                        Gestiona las solicitudes y devoluciones de libros
                        de la Biblioteca del Terror.
                    </p>
                </div>

                {currentUser.role === 'USER' && <LoanDialog />}
            </header>

            <LoansTable
                loans={loans}
                userRole={currentUser.role}
            />
        </main>
    );
}

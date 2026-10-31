
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { LoanActions } from '@/components/loans/loan-actions';

type Loan = {
    id: string;
    status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RETURNED';
    requestedAt: Date;
    approvedAt: Date | null;
    dueDate: Date | null;
    createdAt: Date;
    user: {
        id: string;
        name: string;
        lastName: string | null;
        email: string;
    };
    items: {
        id: string;
        quantity: number;
        returnedAt: Date | null;
        book: {
            id: string;
            title: string;
            author: string;
        };
    }[];
};

type LoansTableProps = {
    loans: Loan[];
    userRole: 'ADMIN' | 'USER';
};

const statusLabels = {
    REQUESTED: 'Pendiente',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    RETURNED: 'Devuelto',
};

const statusStyles = {
    REQUESTED: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    RETURNED: 'bg-blue-100 text-blue-800',
};

function formatDate(date: Date | null) {
    if (!date) return '—';

    return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
    }).format(new Date(date));
}

export function LoansTable({ loans, userRole }: LoansTableProps) {
    const isAdmin = userRole === 'ADMIN';

    if (loans.length === 0) {
        return (
            <div className="rounded-lg border p-8 text-center">
                <h2 className="font-semibold">
                    No hay préstamos registrados
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Cuando se registren solicitudes, aparecerán en esta sección.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {isAdmin && <TableHead>Usuario</TableHead>}
                        <TableHead>Libro</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Solicitud</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Vencimiento</TableHead>

                        {isAdmin && <TableHead>Acciones</TableHead>}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {loans.map((loan) => (
                        <TableRow key={loan.id}>
                            {isAdmin && (
                                <TableCell>
                                    <div className="font-medium">
                                        {loan.user.name} {loan.user.lastName ?? ''}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {loan.user.email}
                                    </div>
                                </TableCell>
                            )}

                            <TableCell>
                                <div className="space-y-1">
                                    {loan.items.map((item) => (
                                        <div key={item.id}>
                                            <div className="font-medium">
                                                {item.book.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.book.author}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TableCell>

                            <TableCell>
                                {loan.items.reduce(
                                    (total, item) => total + item.quantity,
                                    0,
                                )}
                            </TableCell>

                            <TableCell>
                                {formatDate(loan.requestedAt)}
                            </TableCell>

                            <TableCell>
                                <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyles[loan.status]}`}
                                >
                                    {statusLabels[loan.status]}
                                </span>
                            </TableCell>

                            <TableCell>
                                {formatDate(loan.dueDate)}
                            </TableCell>
                            {isAdmin && (
                                <TableCell>
                                    <LoanActions
                                        loanId={loan.id}
                                        status={loan.status}
                                    />
                                </TableCell>
                            )}
                        </TableRow>

                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

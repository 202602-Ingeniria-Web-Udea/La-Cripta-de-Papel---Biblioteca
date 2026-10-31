
import { MoreHorizontalIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type User = {
  id: string;
  name: string;
  lastName: string | null;
  email: string;
  enabled: boolean;
  role: 'ADMIN' | 'USER';
  createdAt: string;
};

export function TableActions({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Apellido</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Habilitado</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className='text-right'>Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.length > 0 ? (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className='font-medium'>{user.name}</TableCell>
              <TableCell>{user.lastName ?? '—'}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.enabled ? 'Sí' : 'No'}</TableCell>
              <TableCell>{user.role}</TableCell>

              <TableCell className='text-right'>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant='ghost' size='icon' className='size-8'>
                        <MoreHorizontalIcon />
                        <span className='sr-only'>Open menu</span>
                      </Button>
                    }
                  />

                  <DropdownMenuContent align='end'>
                    <Link href={`/users/${user.id}`}>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                    </Link>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem variant='destructive'>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className='h-24 text-center'>
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

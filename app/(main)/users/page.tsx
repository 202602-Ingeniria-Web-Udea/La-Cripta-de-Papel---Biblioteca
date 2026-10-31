
import React from 'react';
import { cookies } from 'next/headers';
import { TableActions } from '@/components/users/table';
import { DialogDemo } from '@/components/users/dialog';

type User = {
  id: string;
  name: string;
  lastName: string | null;
  email: string;
  enabled: boolean;
  role: 'ADMIN' | 'USER';
  createdAt: string;
};

async function getUsers(): Promise<User[]> {
  const cookieStore = await cookies();

  const response = await fetch('http://localhost:3000/api/users', {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('No fue posible consultar los usuarios.');
  }

  const data = await response.json();

  return data.users;
}

export default async function Users() {
  const data = await getUsers();

  return (
    <div>
      <div className='flex flex-row justify-around items-center'>
        <div>
          <h1 className='text-5xl font-bold'>MAESTRO DE USUARIOS</h1>
        </div>
        <div>
          <DialogDemo />
        </div>
      </div>

      <div>
        <TableActions users={data} />
      </div>
    </div>
  );
}

import 'server-only';

import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function getCurrentUser() {
  const session = await verifySession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      enabled: true,
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      lastName: true,
      email: true,
      role: true,
      enabled: true,
    },
  });

  return user ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();

  return user?.role === 'ADMIN';
}

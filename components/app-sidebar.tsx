'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  IconBook,
  IconArrowsExchange,
  IconHome,
  IconUsers,
  IconClipboardList,
} from '@tabler/icons-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    lastName: string | null;
    email: string;
    role: 'ADMIN' | 'USER';
  };
};

export function AppSidebar({
  user,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: 'Inicio',
      url: '/home',
      icon: <IconHome />,
    },
    {
      title: 'Transacciones',
      url: '/transactions',
      icon: <IconArrowsExchange />,
    },
    {
      title: 'Préstamos',
      url: '/loans',
      icon: <IconClipboardList />,
    },
    {
      title: 'Maestros',
      url: '/books',
      icon: <IconBook />,
      items: [
        { title: 'Libros', url: '/books' },
        { title: 'Categorías', url: '/categories' },
      ],
    },
    ...(user.role === 'ADMIN'
      ? [
        {
          title: 'Usuarios',
          url: '/users',
          icon: <IconUsers />,
        },
      ]
      : []),
  ].map((item) => {
    const subItems =
      'items' in item
        ? item.items?.map((subItem) => ({
          ...subItem,
          isActive:
            pathname === subItem.url ||
            pathname.startsWith(`${subItem.url}/`),
        }))
        : undefined;

    return {
      ...item,
      items: subItems,
      isActive:
        pathname === item.url ||
        Boolean(subItems?.some((subItem) => subItem.isActive)),
    };
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-2 py-3">
          <div className="font-semibold">Biblioteca del Terror</div>
          <div className="text-xs text-muted-foreground">
            Sistema de gestión
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: `${user.name} ${user.lastName ?? ''}`.trim(),
            email: user.email,
            role: user.role,
            avatar: '',
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
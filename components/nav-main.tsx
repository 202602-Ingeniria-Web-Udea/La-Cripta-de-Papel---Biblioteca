
'use client';

import Link from 'next/link';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { IconChevronRight } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

type NavItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    isActive?: boolean;
  }[];
};

export function NavMain({ items }: { items: NavItem[] }) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const activeItemTitles = items
    .filter((item) => item.isActive && item.items?.length)
    .map((item) => item.title);

  useEffect(() => {
    setOpenItems((current) => [
      ...new Set([...current, ...activeItemTitles]),
    ]);
  }, [activeItemTitles.join('|')]);
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menú principal</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = Boolean(item.items?.length);

          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  tooltip={item.title}
                  isActive={item.isActive}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              open={openItems.includes(item.title)}
              onOpenChange={(open) => {
                setOpenItems((current) =>
                  open
                    ? [...current, item.title]
                    : current.filter((title) => title !== item.title),
                );
              }}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.title} />}
              >
                {item.icon}
                <span>{item.title}</span>
                <IconChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        render={<Link href={subItem.url} />}
                        isActive={subItem.isActive}
                      >
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

import type { Metadata } from 'next';
import { Geist, Geist_Mono, Roboto } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-sans',
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Biblioteca del Terror',
  description: 'Sistema de gestión de biblioteca',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang='es'
      className={cn(
        'h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        roboto.variable,
      )}
    >
      <body className='min-h-full flex flex-col'>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

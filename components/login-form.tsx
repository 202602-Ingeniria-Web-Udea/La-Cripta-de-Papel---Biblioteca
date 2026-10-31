'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user.trim() || !password) {
      toast.error('Ingresa tu correo electrónico y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : 'No fue posible iniciar sesión.',
        );
      }

      setPassword('');
      toast.success(`Bienvenido${data.user?.name ? `, ${data.user.name}` : ''}.`);

      // La API actual todavía no crea una sesión persistente.
      // La redirección se conectará cuando implementemos la cookie segura.
      router.push('/home');
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

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Iniciar sesión</h1>
                <p className="text-balance text-muted-foreground">
                  Ingresa a tu cuenta de la biblioteca.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@ejemplo.com"
                  value={user}
                  onChange={(event) => setUser(event.target.value)}
                  required
                  disabled={loading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                />
              </Field>

              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Verificando...' : 'Iniciar sesión'}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Acceso a la biblioteca
              </FieldSeparator>

              <FieldDescription className="text-center">
                Si no tienes una cuenta, contacta al administrador de la
                biblioteca.
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src="/biblioteca_terror.png"
              alt="Biblioteca especializada en literatura de terror"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Sistema de gestión de biblioteca.
      </FieldDescription>
    </div>
  );
}

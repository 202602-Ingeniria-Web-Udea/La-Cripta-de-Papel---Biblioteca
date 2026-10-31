'use client';

import * as React from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const items = [
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Usuario', value: 'USER' },
] as const;

const formSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  lastName: z.string(),
  email: z.email('Ingresa un correo electrónico válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  role: z.enum(['ADMIN', 'USER'], {
    error: 'Selecciona un rol válido.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function DialogDemo() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      lastName: '',
      email: '',
      password: '',
      role: 'USER',
    },
  });

  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  async function onSubmit(data: FormValues) {
    setLoading(true);

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.error === 'string'
            ? result.error
            : 'No fue posible crear el usuario.',
        );
      }

      toast.success('Usuario creado correctamente.');
      form.reset();
      setOpen(false);
      router.refresh();
      router.push('/users');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.';

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (loading) return;

    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button type="button">Crear usuario</Button>}
      />

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>
            Registra un usuario para el sistema de gestión de biblioteca.
          </DialogDescription>
        </DialogHeader>

        <form
          id="form-rhf-demo"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name-1">Nombre</FieldLabel>
                  <Input
                    {...field}
                    id="name-1"
                    autoComplete="given-name"
                    aria-invalid={fieldState.invalid}
                    disabled={loading}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="lastName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="lastName-1">Apellido</FieldLabel>
                  <Input
                    {...field}
                    id="lastName-1"
                    autoComplete="family-name"
                    aria-invalid={fieldState.invalid}
                    disabled={loading}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email-1">Correo electrónico</FieldLabel>
                  <Input
                    {...field}
                    id="email-1"
                    type="email"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                    disabled={loading}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password-1">Contraseña inicial</FieldLabel>
                  <Input
                    {...field}
                    id="password-1"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    disabled={loading}
                  />
                  <FieldDescription>
                    Debe tener al menos 8 caracteres.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="role-1">Rol</FieldLabel>
                    <FieldDescription>
                      Define los permisos del usuario.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>

                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading}
                  >
                    <SelectTrigger id="role-1" className="w-full">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Rol</SelectLabel>
                        {items.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => form.reset()}
          >
            Limpiar
          </Button>

          <Button
            type="submit"
            form="form-rhf-demo"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner className="size-4" />
                Creando...
              </>
            ) : (
              'Crear usuario'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

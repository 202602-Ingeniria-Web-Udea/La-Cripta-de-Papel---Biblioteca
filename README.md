# La Cripta de Papel — Biblioteca del Terror

Aplicación web para la gestión de una biblioteca especializada en literatura de terror. Permite administrar libros, categorías, usuarios, préstamos y movimientos de inventario desde una interfaz centralizada.

## Integrantes

- Juan Diego Muñetón Herrera

## Funcionalidades

- **Autenticación:** inicio y cierre de sesión.
- **Gestión de usuarios:** administración de cuentas y roles.
- **Gestión de libros:** creación, consulta, edición y eliminación de libros.
- **Gestión de categorías:** organización de los libros por categorías.
- **Gestión de préstamos:** solicitudes, aprobación, rechazo y devolución de libros.
- **Control de inventario:** registro de entradas y salidas, y consulta de existencias.

### Roles

- **Administrador (ADMIN):** acceso a las funcionalidades administrativas y gestión de la biblioteca.
- **Usuario (USER):** acceso a las funcionalidades habilitadas para usuarios, incluyendo las solicitudes de préstamo.

## Tecnologías utilizadas

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma ORM](https://www.prisma.io/)
- [Supabase](https://supabase.com/) — PostgreSQL
- [Vercel](https://vercel.com/) — despliegue

## Requisitos previos

Para ejecutar el proyecto localmente se necesita:

- Node.js y npm.
- Una instancia de PostgreSQL disponible mediante Supabase.
- Acceso a las variables de conexión de la base de datos.

## Instalación y ejecución local

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/202602-Ingeniria-Web-Udea/La-Cripta-de-Papel---Biblioteca.git
   cd La-Cripta-de-Papel---Biblioteca
   ```

2. Instalar las dependencias:

   ```bash
   npm install
   ```

3. Crear un archivo `.env` en la raíz del proyecto y configurar la conexión a PostgreSQL:

   ```env
   DATABASE_URL="TU_CADENA_DE_CONEXION"
   ```

   Reemplazar el valor de ejemplo por la cadena de conexión correspondiente a la base de datos de Supabase.

4. Generar el cliente de Prisma:

   ```bash
   npx prisma generate
   ```

5. Aplicar las migraciones pendientes:

   ```bash
   npx prisma migrate deploy
   ```

6. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

7. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Base de datos

El proyecto utiliza PostgreSQL administrado mediante Supabase y Prisma ORM.

El esquema se encuentra en:

```text
prisma/schema.prisma
```

Las migraciones se encuentran en:

```text
prisma/migrations/
```

La variable `DATABASE_URL` debe configurarse en el entorno de ejecución. No se deben publicar archivos `.env` ni credenciales reales en el repositorio.

## Usuarios de demostración

Las siguientes cuentas están destinadas exclusivamente a la evaluación de la aplicación:

| Rol | Correo electrónico | Contraseña |
|---|---|---|
| Administrador | [diego.muneton@udea.edu.co] | [terror666] |
| Usuario | [jdmherrera1187@gmail.com] | [probando] |

Estas cuentas deben estar creadas y habilitadas en la base de datos utilizada por el despliegue.

## Despliegue

La aplicación está preparada para desplegarse en Vercel.

**URL de producción:** Pendiente de despliegue en Vercel.

Para el despliegue se debe configurar `DATABASE_URL` en las variables de entorno de Vercel y ejecutar las migraciones pendientes sobre la base de datos de producción.

## Licencia

Proyecto académico desarrollado como parte del curso de Ingeniería Web de la Universidad de Antioquia.
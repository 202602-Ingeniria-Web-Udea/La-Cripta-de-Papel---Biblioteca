# La Cripta de Papel — Biblioteca del Terror

Aplicación web para la gestión de una biblioteca especializada en literatura de terror. Permite administrar libros, categorías, usuarios, préstamos y movimientos de inventario desde una interfaz centralizada.

## Integrantes

- Juan Diego Muñetón Herrera

## Aplicación desplegada

**URL de producción:**

https://la-cripta-de-papel-biblioteca-8hsvte3l0.vercel.app/

## Repositorio

[La Cripta de Papel — Biblioteca del Terror](https://github.com/202602-Ingeniria-Web-Udea/La-Cripta-de-Papel---Biblioteca)

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

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/202602-Ingeniria-Web-Udea/La-Cripta-de-Papel---Biblioteca.git
   cd La-Cripta-de-Papel---Biblioteca
   ```

2. **Instalar las dependencias:**

   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**

   Crear un archivo `.env` en la raíz del proyecto:

   ```env
   DATABASE_URL="postgresql://postgres.hyqnooatugpasbhijbgb:Porqueria_2187@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   SESSION_SECRET="4e56e96b8df809c5ee0749da8331eabe81559522a33c4cac7866176141652625"
   ```

   Reemplazar los valores de ejemplo por los correspondientes al entorno local. No compartir ni publicar estos valores.

4. **Generar el cliente de Prisma:**

   ```bash
   npx prisma generate
   ```

5. **Aplicar las migraciones pendientes:**

   ```bash
   npx prisma migrate deploy
   ```

6. **Iniciar el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

7. **Abrir la aplicación en el navegador:**

   http://localhost:3000

## Base de datos

El proyecto utiliza PostgreSQL administrado mediante Supabase y Prisma ORM.

El esquema de datos se encuentra en:

```text
prisma/schema.prisma
```

Las migraciones se encuentran en:

```text
prisma/migrations/
```

La conexión a la base de datos se configura mediante `DATABASE_URL`. La variable `SESSION_SECRET` se utiliza para la gestión de sesiones.

No se deben publicar archivos `.env` ni credenciales reales en el repositorio.

## Usuarios de demostración

Las siguientes cuentas están destinadas a la evaluación de la aplicación:

| Rol | Correo electrónico | Contraseña |
|---|---|---|
| Administrador (ADMIN) | diego.muneton@udea.edu.co | terror666 |
| Usuario (USER) | jdmherrera1187@gmail.com | probando |

Las contraseñas de demostración deben actualizarse antes de la entrega y corresponder a cuentas habilitadas en la base de datos utilizada por el despliegue.

## Despliegue

La aplicación está desplegada en Vercel y utiliza Supabase como servicio de base de datos.

Para configurar un nuevo entorno de despliegue se deben establecer las siguientes variables de entorno:

- `DATABASE_URL`
- `SESSION_SECRET`

El proceso de compilación genera automáticamente Prisma Client mediante el comando:

```bash
prisma generate && next build
```

Las migraciones pendientes deben aplicarse de forma controlada sobre la base de datos de destino mediante:

```bash
npx prisma migrate deploy
```

## Licencia

Proyecto académico desarrollado como parte del curso de Ingeniería Web de la Universidad de Antioquia.
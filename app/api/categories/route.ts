import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Debes iniciar sesión para continuar.' },
                { status: 401 },
            );
        }

        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'No tienes permisos para consultar las categorías.' },
                { status: 403 },
            );
        }

        const categories = await prisma.category.findMany({
            where: {
                enabled: true,
                deleted: false,
            },
            select: {
                id: true,
                name: true,
                description: true,
                enabled: true,
                createdAt: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json({ categories }, { status: 200 });
    } catch (error) {
        console.error('Error fetching categories:', error);

        return NextResponse.json(
            { error: 'No fue posible consultar las categorías.' },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Debes iniciar sesión para continuar.' },
                { status: 401 },
            );
        }

        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'No tienes permisos para crear categorías.' },
                { status: 403 },
            );
        }

        const body: unknown = await request.json();

        if (
            typeof body !== 'object' ||
            body === null ||
            !('name' in body) ||
            typeof body.name !== 'string'
        ) {
            return NextResponse.json(
                { error: 'El nombre de la categoría es obligatorio.' },
                { status: 400 },
            );
        }

        const name = body.name.trim();

        if (!name || name.length > 100) {
            return NextResponse.json(
                { error: 'El nombre debe tener entre 1 y 100 caracteres.' },
                { status: 400 },
            );
        }

        let description: string | null = null;

        if ('description' in body && body.description !== undefined && body.description !== null) {
            if (typeof body.description !== 'string') {
                return NextResponse.json(
                    { error: 'La descripción debe ser un texto.' },
                    { status: 400 },
                );
            }

            description = body.description.trim() || null;

            if (description && description.length > 500) {
                return NextResponse.json(
                    { error: 'La descripción no puede superar los 500 caracteres.' },
                    { status: 400 },
                );
            }
        }

        const category = await prisma.category.create({
            data: {
                name,
                description,
            },
            select: {
                id: true,
                name: true,
                description: true,
                enabled: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        ) {
            return NextResponse.json(
                { error: 'Ya existe una categoría con ese nombre.' },
                { status: 409 },
            );
        }

        console.error('Error creating category:', error);

        return NextResponse.json(
            { error: 'No fue posible crear la categoría.' },
            { status: 500 },
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Debes iniciar sesión para continuar.' },
                { status: 401 },
            );
        }

        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'No tienes permisos para actualizar categorías.' },
                { status: 403 },
            );
        }

        const body: unknown = await request.json();

        if (
            typeof body !== 'object' ||
            body === null ||
            !('id' in body) ||
            typeof body.id !== 'string' ||
            !body.id.trim()
        ) {
            return NextResponse.json(
                { error: 'El identificador de la categoría es obligatorio.' },
                { status: 400 },
            );
        }

        const { id } = body;


        if ('deleted' in body && body.deleted !== true) {
            return NextResponse.json(
                { error: 'El valor de eliminación no es válido.' },
                { status: 400 },
            );
        }

        if ('deleted' in body && body.deleted === true) {
            const category = await prisma.category.update({
                where: { id },
                data: {
                    deleted: true,
                    enabled: false,
                },
                select: {
                    id: true,
                    name: true,
                    deleted: true,
                    enabled: true,
                },
            });

            return NextResponse.json({ category }, { status: 200 });
        }


        const existingCategory = await prisma.category.findFirst({
            where: { id, deleted: false },
            select: { id: true },
        });

        if (!existingCategory) {
            return NextResponse.json(
                { error: 'La categoría no existe o fue eliminada.' },
                { status: 404 },
            );
        }

        const data: {
            name?: string;
            description?: string | null;
            enabled?: boolean;
            deleted?: boolean;
        } = {};

        if ('name' in body) {
            if (typeof body.name !== 'string') {
                return NextResponse.json(
                    { error: 'El nombre debe ser un texto.' },
                    { status: 400 },
                );
            }

            const name = body.name.trim();

            if (!name || name.length > 100) {
                return NextResponse.json(
                    { error: 'El nombre debe tener entre 1 y 100 caracteres.' },
                    { status: 400 },
                );
            }

            data.name = name;
        }

        if ('description' in body) {
            if (
                body.description !== null &&
                typeof body.description !== 'string'
            ) {
                return NextResponse.json(
                    { error: 'La descripción debe ser un texto.' },
                    { status: 400 },
                );
            }

            const description =
                typeof body.description === 'string'
                    ? body.description.trim() || null
                    : null;

            if (description && description.length > 500) {
                return NextResponse.json(
                    { error: 'La descripción no puede superar los 500 caracteres.' },
                    { status: 400 },
                );
            }

            data.description = description;
        }

        if ('enabled' in body) {
            if (typeof body.enabled !== 'boolean') {
                return NextResponse.json(
                    { error: 'El estado debe ser verdadero o falso.' },
                    { status: 400 },
                );
            }

            data.enabled = body.enabled;
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json(
                { error: 'Debes indicar al menos un campo para actualizar.' },
                { status: 400 },
            );
        }

        const category = await prisma.category.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                description: true,
                enabled: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ category }, { status: 200 });
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        ) {
            return NextResponse.json(
                { error: 'Ya existe una categoría con ese nombre.' },
                { status: 409 },
            );
        }

        console.error('Error updating category:', error);

        return NextResponse.json(
            { error: 'No fue posible actualizar la categoría.' },
            { status: 500 },
        );
    }
}

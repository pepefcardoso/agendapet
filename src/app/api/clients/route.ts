// src/app/api/clients/route.ts

import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const createClientSchema = z.object({
  name: z
    .string()
    .min(3, { message: "O nome deve ter no mínimo 3 caracteres" }),
  phone: z.string().min(10, { message: "O telefone é obrigatório" }),
  email: z
    .string()
    .email({ message: "E-mail inválido" })
    .optional()
    .or(z.literal("")),
  whatsapp: z.string().optional(),
});

/**
 * @swagger
 * /api/clients:
 * get:
 * summary: Lista todos os clientes
 * description: Retorna uma lista de todos os clientes cadastrados.
 * tags: [Clients]
 * responses:
 * 200:
 * description: Lista de clientes retornada com sucesso.
 */
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar clientes.", error },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/clients:
 * post:
 * summary: Cria um novo cliente
 * description: Adiciona um novo cliente ao banco de dados.
 * tags: [Clients]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name:
 * type: string
 * phone:
 * type: string
 * email:
 * type: string
 * whatsapp:
 * type: string
 * responses:
 * 201:
 * description: Cliente criado com sucesso.
 * 400:
 * description: Dados inválidos.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createClientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: validation.error.formErrors },
        { status: 400 }
      );
    }

    const { name, phone, email, whatsapp } = validation.data;

    const existingClient = await prisma.client.findFirst({
      where: { OR: [{ phone }, { email: email || undefined }] },
    });

    if (existingClient) {
      return NextResponse.json(
        { message: "Telefone ou e-mail já cadastrado." },
        { status: 409 }
      );
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        phone,
        email,
        whatsapp,
      },
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao criar cliente.", error },
      { status: 500 }
    );
  }
}

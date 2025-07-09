import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const serviceSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
  duration: z.coerce
    .number()
    .int()
    .positive("A duração deve ser um número positivo."),
  price: z.coerce.number().positive("O preço deve ser um número positivo."),
  description: z.string().optional(),
});

/**
 * @swagger
 * /api/services:
 * get:
 * summary: Lista todos os serviços
 * tags: [Services]
 * responses:
 * 200:
 * description: Lista de serviços retornada com sucesso.
 */
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar serviços.", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/services:
 * post:
 * summary: Cria um novo serviço
 * tags: [Services]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ServiceCreate'
 * responses:
 * 201:
 * description: Serviço criado com sucesso.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: validation.error.formErrors },
        { status: 400 }
      );
    }

    const newService = await prisma.service.create({
      data: validation.data,
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao criar serviço.", error: String(error) },
      { status: 500 }
    );
  }
}

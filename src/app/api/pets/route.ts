import { PrismaClient, PetSize } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const petSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres."),
  breed: z.string().optional(),
  size: z.nativeEnum(PetSize, {
    errorMap: () => ({ message: "Selecione um porte válido." }),
  }),
  notes: z.string().optional(),
  clientId: z.string().cuid("ID do cliente inválido."),
});

/**
 * @swagger
 * /api/pets:
 * get:
 * summary: Lista todos os pets
 * tags: [Pets]
 * responses:
 * 200:
 * description: Lista de pets retornada com sucesso.
 */
export async function GET() {
  try {
    const pets = await prisma.pet.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    });
    return NextResponse.json(pets);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar pets.", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/pets:
 * post:
 * summary: Cria um novo pet
 * tags: [Pets]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/PetCreate'
 * responses:
 * 201:
 * description: Pet criado com sucesso.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = petSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const newPet = await prisma.pet.create({
      data: validation.data,
    });

    return NextResponse.json(newPet, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao criar pet.", error: String(error) },
      { status: 500 }
    );
  }
}

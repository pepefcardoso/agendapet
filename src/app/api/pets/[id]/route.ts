import { PrismaClient, PetSize } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const updatePetSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres.").optional(),
  breed: z.string().optional(),
  size: z.nativeEnum(PetSize).optional(),
  notes: z.string().optional(),
  clientId: z.string().cuid("ID do cliente inválido.").optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: params.id },
    });
    if (!pet) {
      return NextResponse.json(
        { message: "Pet não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(pet);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar pet.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = updatePetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedPet = await prisma.pet.update({
      where: { id: params.id },
      data: validation.data,
    });

    return NextResponse.json(updatedPet);
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Pet não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar pet.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.pet.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Pet não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao deletar pet.", error: String(error) },
      { status: 500 }
    );
  }
}

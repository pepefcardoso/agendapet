import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const serviceSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres.").optional(),
  duration: z.coerce
    .number()
    .int()
    .positive("A duração deve ser um número positivo.")
    .optional(),
  price: z.coerce
    .number()
    .positive("O preço deve ser um número positivo.")
    .optional(),
  description: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const service = await prisma.service.findUnique({ where: { id: id } });
    if (!service) {
      return NextResponse.json(
        { message: "Serviço não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar serviço.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await request.json();
    const validation = serviceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: validation.error.formErrors },
        { status: 400 }
      );
    }
    const updatedService = await prisma.service.update({
      where: { id: id },
      data: validation.data,
    });
    return NextResponse.json(updatedService);
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Serviço não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar serviço.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await prisma.service.delete({ where: { id: id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Serviço não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao deletar serviço.", error: String(error) },
      { status: 500 }
    );
  }
}

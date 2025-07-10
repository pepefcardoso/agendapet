import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const updateClientSchema = z.object({
  name: z
    .string()
    .min(3, { message: "O nome deve ter no mínimo 3 caracteres" })
    .optional(),
  phone: z.string().min(10, { message: "O telefone é obrigatório" }).optional(),
  email: z
    .string()
    .email({ message: "E-mail inválido" })
    .optional()
    .or(z.literal("")),
  whatsapp: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const client = await prisma.client.findUnique({ where: { id: id } });
    if (!client) {
      return NextResponse.json(
        { message: "Cliente não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar cliente.", error: String(error) },
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
    const validation = updateClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: validation.error.formErrors },
        { status: 400 }
      );
    }
    const updatedClient = await prisma.client.update({
      where: { id: id },
      data: validation.data,
    });
    return NextResponse.json(updatedClient);
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Cliente não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar cliente.", error: String(error) },
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
    await prisma.client.delete({ where: { id: id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Cliente não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao deletar cliente.", error: String(error) },
      { status: 500 }
    );
  }
}

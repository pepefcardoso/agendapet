import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const requestSchema = z.object({
  phone: z.string().min(10, "O número de telefone é inválido."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Número de telefone inválido." },
        { status: 400 }
      );
    }

    const { phone } = validation.data;

    const client = await prisma.client.findUnique({
      where: { phone },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Cliente não encontrado com este número de telefone." },
        { status: 404 }
      );
    }

    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.client.update({
      where: { id: client.id },
      data: { accessCode },
    });

    // Em um ambiente de produção, aqui seria o local para integrar com um
    // serviço de envio de SMS ou WhatsApp para enviar o código ao cliente.
    console.log(
      `CÓDIGO DE ACESSO PARA ${client.name} (${phone}): ${accessCode}`
    );

    return NextResponse.json({
      message:
        "Código de acesso enviado com sucesso! Verifique o console do servidor.",
    });
  } catch (error) {
    console.error("Erro ao solicitar código de acesso:", error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno ao solicitar o código de acesso." },
      { status: 500 }
    );
  }
}

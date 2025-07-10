import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/../auth";
import { z } from "zod";

const prisma = new PrismaClient();

const settingsSchema = z.object({
  mercadoPagoAccessToken: z.string().min(1, "Access Token é obrigatório."),
  // Adicione a validação para o Webhook Secret se necessário
});

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const settings = await prisma.paymentSettings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json(
      { message: "Erro ao buscar configurações." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { mercadoPagoAccessToken } = validation.data;

    const settings = await prisma.paymentSettings.upsert({
      where: { id: "singleton" },
      update: { mercadoPagoAccessToken, isActive: true },
      create: { id: "singleton", mercadoPagoAccessToken, isActive: true },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json(
      { message: "Erro ao salvar configurações." },
      { status: 500 }
    );
  }
}

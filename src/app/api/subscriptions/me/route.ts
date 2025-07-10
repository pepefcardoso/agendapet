import { auth } from "@/../auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/subscriptions/me:
 * get:
 * summary: Retorna a assinatura e os créditos do cliente autenticado
 * tags: [Subscriptions]
 * responses:
 * 200:
 * description: Dados da assinatura retornados com sucesso.
 * 401:
 * description: Cliente não autenticado.
 * 404:
 * description: Nenhuma assinatura ativa encontrada.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json(
      { message: "Acesso não autorizado." },
      { status: 401 }
    );
  }

  try {
    const clientId = session.user.id;

    const subscriptionStatus = await prisma.subscriptionStatus.findFirst({
      where: {
        clientId: clientId,
        status: "ACTIVE",
      },
    });

    if (!subscriptionStatus) {
      return NextResponse.json(
        { message: "Nenhuma assinatura ativa encontrada." },
        { status: 404 }
      );
    }

    const subscriptionCredits = await prisma.subscriptionCredit.findMany({
      where: {
        clientId: clientId,
        planId: subscriptionStatus.planId,
        renewalDate: subscriptionStatus.renewalDate,
      },
      orderBy: {
        serviceName: "asc",
      },
    });

    const responsePayload = {
      ...subscriptionStatus,
      credits: subscriptionCredits,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Erro ao buscar dados da assinatura do cliente:", error);
    return NextResponse.json(
      { message: "Erro ao buscar dados da assinatura." },
      { status: 500 }
    );
  }
}

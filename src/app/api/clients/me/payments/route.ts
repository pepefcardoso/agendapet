import { auth } from "@/../auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

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

    const payments = await prisma.payment.findMany({
      where: {
        clientId: clientId,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Erro ao buscar histórico de pagamentos:", error);
    return NextResponse.json(
      { message: "Erro ao buscar histórico de pagamentos." },
      { status: 500 }
    );
  }
}

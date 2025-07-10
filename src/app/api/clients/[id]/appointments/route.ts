import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const appointments = await prisma.appointment.findMany({
      where: { clientId: id },
      orderBy: { date: "desc" },
      include: {
        pet: { select: { name: true } },
        services: { select: { name: true, price: true } },
      },
    });

    if (!appointments || appointments.length === 0) {
      return NextResponse.json(
        { message: "Nenhum agendamento encontrado para este cliente." },
        { status: 404 }
      );
    }

    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Erro ao buscar agendamentos do cliente.",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

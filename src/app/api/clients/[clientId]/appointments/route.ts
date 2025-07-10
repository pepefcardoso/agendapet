import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/clients/{clientId}/appointments:
 * get:
 * summary: Lista os agendamentos de um cliente específico
 * tags: [Clients, Appointments]
 * parameters:
 * - in: path
 * name: clientId
 * required: true
 * schema:
 * type: string
 * description: O ID do cliente.
 * responses:
 * 200:
 * description: Lista de agendamentos retornada com sucesso.
 * 404:
 * description: Cliente não encontrado.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: clientId } = params;

    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: clientId,
      },
      orderBy: {
        date: "desc",
      },
      include: {
        pet: { select: { name: true } },
        services: { select: { name: true, price: true } },
      },
    });

    if (!appointments) {
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

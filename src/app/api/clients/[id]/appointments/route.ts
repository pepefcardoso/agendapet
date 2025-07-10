import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/clients/{id}/appointments:
 * get:
 * summary: Lista os agendamentos de um cliente específico
 * tags: [Clients, Appointments]
 * parameters:
 * - in: path
 * name: id
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
    const { id: clientId } = params; // O parâmetro agora é 'id'

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

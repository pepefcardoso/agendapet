import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const updateAppointmentSchema = z.object({
  clientId: z.string().cuid("ID do cliente inválido.").optional(),
  petId: z.string().cuid("ID do pet inválido.").optional(),
  serviceIds: z.array(z.string().cuid("ID de serviço inválido.")).optional(),
  date: z
    .string()
    .datetime("A data deve estar no formato ISO 8601.")
    .optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { name: true, id: true } },
        pet: { select: { name: true, id: true } },
        services: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: "Agendamento não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar agendamento.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = updateAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { serviceIds, ...restOfData } = validation.data;

    const dataToUpdate: Prisma.AppointmentUpdateInput = {
      ...restOfData,
    };

    if (serviceIds) {
      dataToUpdate.services = {
        set: serviceIds.map((id) => ({ id })),
      };
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Agendamento não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar agendamento.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.appointment.delete({
      where: { id: params.id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Agendamento não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao deletar agendamento.", error: String(error) },
      { status: 500 }
    );
  }
}

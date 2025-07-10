import { PrismaClient, AppointmentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const appointmentSchema = z.object({
  clientId: z.string().cuid("ID do cliente inválido."),
  petId: z.string().cuid("ID do pet inválido."),
  serviceIds: z
    .array(z.string().cuid("ID de serviço inválido."))
    .min(1, "Selecione ao menos um serviço."),
  date: z
    .string()
    .datetime({ message: "A data deve estar no formato ISO 8601." }),
  notes: z.string().optional(),
});

type WorkingHours = {
  [day: string]: { start: string; end: string; open: boolean } | undefined;
};

export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: {
        date: "asc",
      },
      include: {
        client: { select: { name: true } },
        pet: { select: { name: true } },
        services: {
          select: { id: true, name: true, price: true, duration: true },
        },
      },
    });
    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar agendamentos.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = appointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { clientId, petId, serviceIds, date, notes } = validation.data;
    const newAppointmentStart = new Date(date);

    const petShopConfig = await prisma.petShop.findFirst();
    if (!petShopConfig || !petShopConfig.workingHours) {
      return NextResponse.json(
        { message: "Configurações de horário do pet shop não encontradas." },
        { status: 500 }
      );
    }
    const workingHours = petShopConfig.workingHours as WorkingHours;

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });
    const totalDuration = services.reduce(
      (acc, service) => acc + service.duration,
      0
    );
    const newAppointmentEnd = new Date(
      newAppointmentStart.getTime() + totalDuration * 60000
    );

    const dayOfWeek = newAppointmentStart
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();
    const schedule = workingHours[dayOfWeek];

    if (!schedule || !schedule.open) {
      return NextResponse.json(
        { message: `O pet shop está fechado na ${dayOfWeek}.` },
        { status: 400 }
      );
    }

    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const openingTime = timeToMinutes(schedule.start);
    const closingTime = timeToMinutes(schedule.end);
    const appointmentStartMinutes =
      newAppointmentStart.getHours() * 60 + newAppointmentStart.getMinutes();
    const appointmentEndMinutes = appointmentStartMinutes + totalDuration;

    if (
      appointmentStartMinutes < openingTime ||
      appointmentEndMinutes > closingTime
    ) {
      return NextResponse.json(
        {
          message: `Horário inválido. O funcionamento na ${dayOfWeek} é das ${schedule.start} às ${schedule.end}.`,
        },
        { status: 400 }
      );
    }

    const dayStart = new Date(newAppointmentStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(newAppointmentStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: { gte: dayStart, lt: dayEnd },
        status: { notIn: ["CANCELLED"] },
      },
      include: { services: true },
    });

    for (const existing of existingAppointments) {
      const existingStart = new Date(existing.date);
      const existingDuration = existing.services.reduce(
        (acc, s) => acc + s.duration,
        0
      );
      const existingEnd = new Date(
        existingStart.getTime() + existingDuration * 60000
      );

      if (
        newAppointmentStart < existingEnd &&
        existingStart < newAppointmentEnd
      ) {
        return NextResponse.json(
          {
            message: `Conflito de horário. Já existe um agendamento entre ${existingStart.toLocaleTimeString()} e ${existingEnd.toLocaleTimeString()}.`,
          },
          { status: 409 }
        );
      }
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        clientId,
        petId,
        date: newAppointmentStart,
        notes,
        status: AppointmentStatus.PENDING,
        services: { connect: serviceIds.map((id) => ({ id })) },
      },
      include: { client: true, pet: true, services: true },
    });

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erro ao criar agendamento.", error: String(error) },
      { status: 500 }
    );
  }
}

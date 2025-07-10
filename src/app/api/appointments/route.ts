import { PrismaClient, AppointmentStatus, Prisma } from "@prisma/client";
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
  isFromSubscription: z.boolean().optional(),
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

    const { clientId, petId, serviceIds, date, notes, isFromSubscription } =
      validation.data;

    const newAppointment = await prisma.$transaction(async (tx) => {
      const newAppointmentStart = new Date(date);

      const petShopConfig = await tx.petShop.findFirst();
      if (!petShopConfig || !petShopConfig.workingHours) {
        throw new Error(
          "Configurações de horário do pet shop não encontradas."
        );
      }
      const workingHours = petShopConfig.workingHours as WorkingHours;

      const services = await tx.service.findMany({
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
        throw new Error(`O pet shop está fechado na ${dayOfWeek}.`);
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
        throw new Error(
          `Horário inválido. O funcionamento na ${dayOfWeek} é das ${schedule.start} às ${schedule.end}.`
        );
      }

      const dayStart = new Date(newAppointmentStart);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(newAppointmentStart);
      dayEnd.setHours(23, 59, 59, 999);

      const existingAppointments = await tx.appointment.findMany({
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
          throw new Error(
            `Conflito de horário. Já existe um agendamento entre ${existingStart.toLocaleTimeString()} e ${existingEnd.toLocaleTimeString()}.`
          );
        }
      }

      if (isFromSubscription) {
        for (const service of services) {
          const credit = await tx.subscriptionCredit.findFirst({
            where: {
              clientId: clientId,
              serviceId: service.id,
              remainingCredits: { gt: 0 },
            },
          });

          if (!credit) {
            throw new Error(
              `Créditos insuficientes para o serviço: ${service.name}.`
            );
          }

          await tx.subscriptionCredit.update({
            where: { id: credit.id },
            data: {
              usedCredits: { increment: 1 },
              remainingCredits: { decrement: 1 },
            },
          });
        }
      }

      const appointmentData: Prisma.AppointmentCreateInput = {
        client: { connect: { id: clientId } },
        pet: { connect: { id: petId } },
        services: { connect: serviceIds.map((id) => ({ id })) },
        date: newAppointmentStart,
        notes,
        status: isFromSubscription
          ? AppointmentStatus.CONFIRMED
          : AppointmentStatus.PENDING,
        isFromSubscription: isFromSubscription || false,
      };

      const createdAppointment = await tx.appointment.create({
        data: appointmentData,
        include: { client: true, pet: true, services: true },
      });

      return createdAppointment;
    });

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { message: "Erro ao criar agendamento.", error: String(error) },
      { status: 500 }
    );
  }
}

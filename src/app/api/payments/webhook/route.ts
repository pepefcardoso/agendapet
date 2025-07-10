import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  PaymentStatus,
  AppointmentStatus,
  PaymentMethod,
  Prisma,
} from "@prisma/client";
import { MercadoPagoConfig, Payment } from "mercadopago";

const prisma = new PrismaClient();

// A assinatura do Webhook deve ser guardada como uma variável de ambiente
const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  // TODO: Implementar a validação da assinatura do webhook em produção
  // A lógica de validação usando o WEBHOOK_SECRET deve ser adicionada aqui
  // para garantir que a requisição é genuína do Mercado Pago.
  // Ex: if (!isValidSignature(request, WEBHOOK_SECRET)) {
  //   return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  // }
  console.log(WEBHOOK_SECRET);

  try {
    const body = await request.json();

    if (body.type === "payment") {
      const paymentId = body.data.id;
      const payment = await new Payment(client).get({ id: paymentId });

      if (payment && payment.external_reference) {
        const appointmentId = payment.external_reference;
        const paymentStatus = payment.status;

        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: { services: true, pet: true },
        });

        if (!appointment) {
          console.error(
            `Webhook: Agendamento com ID ${appointmentId} não encontrado.`
          );
          return NextResponse.json(
            { message: "Appointment not found" },
            { status: 404 }
          );
        }

        if (paymentStatus === "approved") {
          await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
              status: AppointmentStatus.CONFIRMED,
            },
          });
        }

        const dbPaymentStatus: PaymentStatus =
          paymentStatus === "approved"
            ? PaymentStatus.SUCCEEDED
            : paymentStatus === "rejected"
            ? PaymentStatus.FAILED
            : PaymentStatus.PENDING;

        const paymentMethod: PaymentMethod =
          payment.payment_method_id === "pix"
            ? PaymentMethod.PIX
            : PaymentMethod.CREDIT_CARD;

        await prisma.payment.upsert({
          where: { appointmentId: appointmentId },
          update: {
            status: dbPaymentStatus,
            mercadoPagoId: payment.id?.toString(),
            updatedAt: new Date(),
          },
          create: {
            appointmentId: appointmentId,
            clientId: appointment.clientId,
            petName: appointment.pet.name,
            serviceName: appointment.services.map((s) => s.name).join(", "),
            date: new Date(payment.date_created!),
            amount: new Prisma.Decimal(payment.transaction_amount || 0),
            status: dbPaymentStatus,
            paymentMethod: paymentMethod,
            mercadoPagoId: payment.id?.toString(),
          },
        });
      }
    }

    return NextResponse.json({ status: "received" }, { status: 200 });
  } catch (error) {
    console.error("Erro no webhook do Mercado Pago:", error);
    return NextResponse.json(
      { message: "Erro interno no processamento do webhook." },
      { status: 500 }
    );
  }
}

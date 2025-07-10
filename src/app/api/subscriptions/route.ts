// src/app/api/subscriptions/route.ts
import { PrismaClient, SubscriptionPlanStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addMonths, startOfDay } from "date-fns";

const prisma = new PrismaClient();

const createSubscriptionSchema = z.object({
  clientId: z.string().cuid("ID de cliente inválido."),
  planId: z.string().cuid("ID do plano inválido."),
});

/**
 * @swagger
 * /api/subscriptions:
 * post:
 * summary: Inscreve um cliente em um plano de assinatura
 * tags: [Subscriptions]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * clientId:
 * type: string
 * planId:
 * type: string
 * responses:
 * 201:
 * description: Inscrição realizada com sucesso.
 * 400:
 * description: Dados inválidos.
 * 404:
 * description: Cliente ou Plano não encontrado.
 * 409:
 * description: Cliente já possui uma assinatura ativa.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { clientId, planId } = validation.data;

    const newSubscription = await prisma.$transaction(async (tx) => {
      const client = await tx.client.findUnique({ where: { id: clientId } });
      const plan = await tx.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!client || !plan) {
        throw new Error("Cliente ou Plano de Assinatura não encontrado.");
      }

      const existingActiveSubscription = await tx.subscriptionStatus.findFirst({
        where: {
          clientId: clientId,
          status: "ACTIVE",
        },
      });

      if (existingActiveSubscription) {
        throw new Error("Este cliente já possui uma assinatura ativa.");
      }

      const today = startOfDay(new Date());
      const renewalDate = addMonths(today, 1);

      const subscriptionStatus = await tx.subscriptionStatus.create({
        data: {
          clientId,
          planId,
          planName: plan.name,
          status: SubscriptionPlanStatus.ACTIVE,
          startDate: today,
          renewalDate: renewalDate,
        },
      });

      const creditPromises = (
        plan.credits as { serviceId: string; quantity: number }[]
      ).map(async (credit) => {
        const service = await tx.service.findUnique({
          where: { id: credit.serviceId },
        });
        if (!service)
          throw new Error(`Serviço com ID ${credit.serviceId} não encontrado.`);

        return tx.subscriptionCredit.create({
          data: {
            clientId,
            planId,
            serviceId: credit.serviceId,
            serviceName: service.name,
            totalCredits: credit.quantity,
            usedCredits: 0,
            remainingCredits: credit.quantity,
            renewalDate: renewalDate,
          },
        });
      });

      await Promise.all(creditPromises);

      return subscriptionStatus;
    });

    return NextResponse.json(newSubscription, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar assinatura:", error);
    if (error instanceof Error) {
      if (error.message.includes("encontrado")) {
        return NextResponse.json({ message: error.message }, { status: 404 });
      }
      if (error.message.includes("ativa")) {
        return NextResponse.json({ message: error.message }, { status: 409 });
      }
    }
    return NextResponse.json(
      { message: "Erro ao criar assinatura.", error: String(error) },
      { status: 500 }
    );
  }
}

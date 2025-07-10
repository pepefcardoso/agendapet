import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { addMonths, startOfDay } from "date-fns";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // 1. Segurança: Protegendo a Rota
  // Em produção, esta rota deve ser protegida para que apenas o serviço de Cron possa chamá-la.
  // A Vercel faz isso automaticamente injetando uma chave secreta.
  const cronSecret = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && process.env.CRON_SECRET !== cronSecret) {
    return NextResponse.json(
      { message: "Acesso não autorizado." },
      { status: 401 }
    );
  }

  try {
    const today = startOfDay(new Date());

    const subscriptionsToRenew = await prisma.subscriptionStatus.findMany({
      where: {
        status: "ACTIVE",
        renewalDate: {
          lte: today,
        },
      },
      include: {
        plan: true,
      },
    });

    if (subscriptionsToRenew.length === 0) {
      return NextResponse.json({
        message: "Nenhuma assinatura para renovar hoje.",
      });
    }

    let renewedCount = 0;

    for (const sub of subscriptionsToRenew) {
      await prisma.$transaction(async (tx) => {
        const nextRenewalDate = addMonths(sub.renewalDate, 1);

        await tx.subscriptionStatus.update({
          where: { id: sub.id },
          data: {
            renewalDate: nextRenewalDate,
            // Opcional: pode-se resetar a startDate para o início do novo ciclo
            // startDate: today,
          },
        });

        await tx.subscriptionCredit.deleteMany({
          where: {
            clientId: sub.clientId,
            planId: sub.planId,
          },
        });

        const creditPromises = (
          sub.plan.credits as { serviceId: string; quantity: number }[]
        ).map(async (creditInfo) => {
          const service = await tx.service.findUnique({
            where: { id: creditInfo.serviceId },
          });
          if (!service)
            throw new Error(
              `Serviço com ID ${creditInfo.serviceId} não encontrado durante a renovação.`
            );

          return tx.subscriptionCredit.create({
            data: {
              clientId: sub.clientId,
              planId: sub.planId,
              serviceId: creditInfo.serviceId,
              serviceName: service.name,
              totalCredits: creditInfo.quantity,
              usedCredits: 0,
              remainingCredits: creditInfo.quantity,
              renewalDate: nextRenewalDate,
            },
          });
        });

        await Promise.all(creditPromises);
        renewedCount++;
      });
    }

    return NextResponse.json({
      message: `Renovação concluída com sucesso. ${renewedCount} assinatura(s) renovada(s).`,
    });
  } catch (error) {
    console.error("Erro no processo de renovação de assinaturas:", error);
    return NextResponse.json(
      {
        message: "Erro interno no servidor ao renovar assinaturas.",
        error: String(error),
      },
      { status: 500 }
    );
  }
}

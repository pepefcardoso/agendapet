import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const updateSubscriptionPlanSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres.").optional(),
  price: z.coerce
    .number()
    .positive("O preço deve ser um número positivo.")
    .optional(),
  description: z.string().optional().nullable(),
  credits: z
    .array(
      z.object({
        serviceId: z.string().cuid("ID de serviço inválido."),
        quantity: z.coerce
          .number()
          .int()
          .positive("A quantidade deve ser positiva."),
      })
    )
    .min(1, "O plano deve oferecer créditos para pelo menos um serviço.")
    .optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: id },
    });
    if (!plan) {
      return NextResponse.json(
        { message: "Plano de assinatura não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar plano de assinatura.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  try {
    const body = await request.json();
    const validation = updateSubscriptionPlanSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { credits, ...planData } = validation.data;
    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: id },
      data: {
        ...planData,
        ...(credits && { credits: credits as Prisma.JsonArray }),
      },
    });
    return NextResponse.json(updatedPlan);
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Plano não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao atualizar plano.", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  try {
    const existingSubscriptions = await prisma.subscriptionStatus.count({
      where: { planId: id, status: "ACTIVE" },
    });

    if (existingSubscriptions > 0) {
      return NextResponse.json(
        {
          message:
            "Não é possível excluir. Existem assinaturas ativas para este plano.",
        },
        { status: 409 }
      );
    }

    await prisma.subscriptionPlan.delete({ where: { id: id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Plano não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Erro ao deletar plano.", error: String(error) },
      { status: 500 }
    );
  }
}

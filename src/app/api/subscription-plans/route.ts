import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();

const subscriptionPlanSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
  price: z.coerce.number().positive("O preço deve ser um número positivo."),
  description: z.string().optional(),
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
    .min(1, "O plano deve oferecer créditos para pelo menos um serviço."),
});

/**
 * @swagger
 * /api/subscription-plans:
 * get:
 * summary: Lista todos os planos de assinatura
 * tags: [SubscriptionPlans]
 * responses:
 * 200:
 * description: Lista de planos retornada com sucesso.
 */
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar planos de assinatura.", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/subscription-plans:
 * post:
 * summary: Cria um novo plano de assinatura
 * tags: [SubscriptionPlans]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/SubscriptionPlanCreate'
 * responses:
 * 201:
 * description: Plano criado com sucesso.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = subscriptionPlanSchema.safeParse(body);

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

    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        ...planData,
        credits: credits as Prisma.JsonArray,
      },
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao criar plano de assinatura.", error: String(error) },
      { status: 500 }
    );
  }
}

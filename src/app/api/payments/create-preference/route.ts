import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { z } from "zod";

// Inicializa o cliente do Mercado Pago com o Access Token
// Este token deve vir das suas configurações de pagamento no banco de dados
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const preferenceSchema = z.object({
  title: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  appointmentId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = preferenceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos para criar a preferência.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { title, quantity, unit_price, appointmentId } = validation.data;

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: appointmentId,
            title: title,
            quantity: quantity,
            unit_price: unit_price,
            currency_id: "BRL",
          },
        ],

        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/me/appointments?payment_status=success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/me/appointments?payment_status=failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/me/appointments?payment_status=pending`,
        },
        auto_return: "approved",
        external_reference: appointmentId,
      },
    });

    return NextResponse.json({ preferenceId: result.id });
  } catch (error) {
    console.error("Erro ao criar preferência no Mercado Pago:", error);
    return NextResponse.json(
      { message: "Erro interno ao criar preferência de pagamento." },
      { status: 500 }
    );
  }
}

"use client";

import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { useEffect, useState } from "react";

// A sua Chave Pública (Public Key) deve ser uma variável de ambiente
if (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
} else {
  console.error("Mercado Pago Public Key not found.");
}

type PaymentButtonProps = {
  appointmentId: string;
  title: string;
  price: number;
};

export function PaymentButton({
  appointmentId,
  title,
  price,
}: PaymentButtonProps) {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPreference = async () => {
      setError(null);
      try {
        const response = await fetch("/api/payments/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title,
            unit_price: price,
            quantity: 1,
            appointmentId: appointmentId,
          }),
        });
        const data = await response.json();
        if (response.ok && data.preferenceId) {
          setPreferenceId(data.preferenceId);
        } else {
          throw new Error(
            data.message || "Falha ao criar a preferência de pagamento."
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
        console.error("Erro ao criar preferência:", errorMessage);
        setError(errorMessage);
      }
    };

    if (appointmentId && title && price > 0) {
      createPreference();
    }
  }, [appointmentId, title, price]);

  if (error) {
    return (
      <p className="text-red-500 bg-red-100 p-3 rounded-md">
        Erro ao carregar o pagamento: {error}
      </p>
    );
  }

  if (!preferenceId) {
    return <p className="text-gray-500">Gerando link de pagamento...</p>;
  }

  return (
    <div>
      <Wallet
        initialization={{ preferenceId }}
        customization={{
          customStyle: {
            buttonBackground: "blue",
            buttonHeight: "48px",
          },
        }}
      />
    </div>
  );
}

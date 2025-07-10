"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Credit = {
  serviceName: string;
  remainingCredits: number;
  totalCredits: number;
};

type SubscriptionData = {
  planName: string;
  status: string;
  renewalDate: string;
  credits: Credit[];
};

export function MySubscriptionDetails() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        setLoading(true);
        const response = await fetch("/api/subscriptions/me");

        if (response.status === 404) {
          setSubscription(null);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Falha ao buscar sua assinatura."
          );
        }

        const data = await response.json();
        setSubscription(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ocorreu um erro desconhecido."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <p className="text-center text-gray-500">
        A carregar dados da sua assinatura...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-500 bg-red-100 p-4 rounded-md">
        {error}
      </p>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700">
          Você não possui uma assinatura ativa.
        </h3>
        <p className="text-gray-500 mt-2">
          Explore nossos planos para aproveitar benefícios exclusivos!
        </p>
        {/* Futuramente, podemos adicionar um botão aqui para ver os planos */}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 md:p-8">
      <div className="flex justify-between items-start pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {subscription.planName}
          </h2>
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
            {subscription.status}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Próxima renovação em:</p>
          <p className="font-semibold text-gray-700">
            {format(
              new Date(subscription.renewalDate),
              "dd 'de' MMMM 'de' yyyy",
              { locale: ptBR }
            )}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Seus Créditos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscription.credits.map((credit, index) => (
            <div
              key={index}
              className="bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <p className="font-bold text-gray-800">{credit.serviceName}</p>
              <p className="text-gray-600">
                <span className="text-2xl font-bold text-blue-600">
                  {credit.remainingCredits}
                </span>
                <span className="text-sm">
                  {" "}
                  / {credit.totalCredits} restantes
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

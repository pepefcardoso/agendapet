"use client";

import { useState, useEffect } from "react";
import { SubscriptionPlan } from "@prisma/client";

type SubscribeClientModalProps = {
  clientId: string;
  clientName: string;
  onSuccess: () => void;
  onClose: () => void;
};

export function SubscribeClientModal({
  clientId,
  clientName,
  onSuccess,
  onClose,
}: SubscribeClientModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/subscription-plans?active=true");
        if (!response.ok) throw new Error("Falha ao carregar os planos.");
        const data = await response.json();
        setPlans(data);
        if (data.length > 0) {
          setSelectedPlanId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handleSubmit = async () => {
    if (!selectedPlanId) {
      setError("Por favor, selecione um plano.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, planId: selectedPlanId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Falha ao realizar a inscrição.");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Inscrever {clientName}</h3>
      {error && (
        <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>
      )}

      {loading ? (
        <p>A carregar planos...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="plan"
              className="block text-sm font-medium text-gray-700"
            >
              Selecione o Plano de Assinatura
            </label>
            <select
              id="plan"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - R$ {Number(plan.price).toFixed(2)}/mês
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={onClose}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || loading || plans.length === 0}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
        >
          {submitting ? "A inscrever..." : "Confirmar Inscrição"}
        </button>
      </div>
    </div>
  );
}

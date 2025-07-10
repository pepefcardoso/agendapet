"use client";

import { useState, useEffect } from "react";
import { SubscriptionPlan } from "@prisma/client";

type Service = {
  id: string;
  name: string;
};

type Credit = {
  serviceId: string;
  quantity: number;
};

type SubscriptionPlanFormProps = {
  plan?: SubscriptionPlan | null;
  services: Service[];
  onSuccess: () => void;
};

export function SubscriptionPlanForm({
  plan,
  services,
  onSuccess,
}: SubscriptionPlanFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    isActive: true,
  });
  const [credits, setCredits] = useState<Credit[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        price: String(plan.price),
        description: plan.description || "",
        isActive: plan.isActive,
      });
      setCredits((plan.credits as unknown as Credit[]) || []);
    } else {
      setFormData({ name: "", price: "", description: "", isActive: true });
      setCredits([]);
    }
  }, [plan]);

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreditChange = (
    index: number,
    field: keyof Credit,
    value: string | number
  ) => {
    const newCredits = [...credits];
    const creditToUpdate = { ...newCredits[index], [field]: value };
    newCredits[index] = creditToUpdate;
    setCredits(newCredits);
  };

  const addCredit = () => {
    if (services.length > 0) {
      setCredits([...credits, { serviceId: services[0].id, quantity: 1 }]);
    }
  };

  const removeCredit = (index: number) => {
    setCredits(credits.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const finalCredits = credits.map((c) => ({
      serviceId: c.serviceId,
      quantity: Number(c.quantity),
    }));

    if (finalCredits.length === 0) {
      setError("O plano deve incluir pelo menos um crédito.");
      setSubmitting(false);
      return;
    }

    const planData = {
      ...formData,
      price: Number(formData.price),
      credits: finalCredits,
    };

    const url = plan
      ? `/api/subscription-plans/${plan.id}`
      : "/api/subscription-plans";
    const method = plan ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao salvar o plano.");
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nome do Plano
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleFormChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Preço (R$)
          </label>
          <input
            type="number"
            step="0.01"
            name="price"
            id="price"
            value={formData.price}
            onChange={handleFormChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Descrição (Opcional)
        </label>
        <textarea
          name="description"
          id="description"
          value={formData.description}
          onChange={handleFormChange}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Créditos Inclusos
        </h3>
        <div className="space-y-4">
          {credits.map((credit, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-md"
            >
              <select
                value={credit.serviceId}
                onChange={(e) =>
                  handleCreditChange(index, "serviceId", e.target.value)
                }
                className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={credit.quantity}
                onChange={(e) =>
                  handleCreditChange(index, "quantity", Number(e.target.value))
                }
                min="1"
                className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
              <button
                type="button"
                onClick={() => removeCredit(index)}
                className="text-red-600 hover:text-red-800 font-semibold"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCredit}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
        >
          + Adicionar Serviço
        </button>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isActive"
          id="isActive"
          checked={formData.isActive}
          onChange={handleFormChange}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
          Plano Ativo
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
        >
          {submitting ? "Salvando..." : "Salvar Plano"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { SubscriptionPlanForm } from "./SubscriptionPlanForm";
import { Modal } from "@/components/ui/Modal";
import { SubscriptionPlan } from "@prisma/client";

type Service = {
  id: string;
  name: string;
};

export function SubscriptionPlanList() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const serviceNameMap = useMemo(() => {
    return services.reduce((acc, service) => {
      acc[service.id] = service.name;
      return acc;
    }, {} as Record<string, string>);
  }, [services]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [plansResponse, servicesResponse] = await Promise.all([
        fetch("/api/subscription-plans"),
        fetch("/api/services"),
      ]);

      if (!plansResponse.ok) throw new Error("Falha ao buscar os planos.");
      if (!servicesResponse.ok) throw new Error("Falha ao buscar os serviços.");

      const plansData = await plansResponse.json();
      const servicesData = await servicesResponse.json();

      setPlans(plansData);
      setServices(servicesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingPlan(null);
  };

  const handleFormSuccess = () => {
    closeFormModal();
    fetchData();
  };

  const openDeleteModal = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan);
  };

  const closeDeleteModal = () => {
    setPlanToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/subscription-plans/${planToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao excluir o plano.");
      }

      closeDeleteModal();
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <p>Carregando planos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Lista de Planos</h2>
          <button
            onClick={openCreateModal}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Adicionar Plano
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border-b text-left">Nome</th>
                <th className="py-2 px-4 border-b text-left">Preço</th>
                <th className="py-2 px-4 border-b text-left">Créditos</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.length > 0 ? (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{plan.name}</td>
                    <td className="py-2 px-4 border-b">
                      R$ {Number(plan.price).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {(
                        plan.credits as {
                          serviceId: string;
                          quantity: number;
                        }[]
                      )
                        .map(
                          (c) =>
                            `${c.quantity}x ${
                              serviceNameMap[c.serviceId] || "Serviço"
                            }`
                        )
                        .join(", ")}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          plan.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {plan.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => openEditModal(plan)}
                        className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openDeleteModal(plan)}
                        className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 px-4 text-center text-gray-500"
                  >
                    Nenhum plano de assinatura encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={
          editingPlan ? "Editar Plano de Assinatura" : "Adicionar Novo Plano"
        }
      >
        <SubscriptionPlanForm
          onSuccess={handleFormSuccess}
          plan={editingPlan}
          services={services}
        />
      </Modal>

      <Modal
        isOpen={!!planToDelete}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão"
      >
        {planToDelete && (
          <div>
            <p>
              Você tem certeza que deseja excluir o plano de assinatura{" "}
              <strong>{planToDelete.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              Esta ação não pode ser desfeita e removerá o plano
              permanentemente.
            </p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={closeDeleteModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:bg-red-300"
              >
                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// src/components/services/ServiceList.tsx

"use client";

import { useEffect, useState } from "react";
import { ServiceForm } from "./ServiceForm";
import { Modal } from "../ui/modal";

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
};

export function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchServices() {
    try {
      setLoading(true);
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Falha ao buscar os serviços.");
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingService(null);
  };

  const handleFormSuccess = () => {
    closeFormModal();
    fetchServices();
  };

  const openDeleteModal = (service: Service) => {
    setServiceToDelete(service);
  };

  const closeDeleteModal = () => {
    setServiceToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/services/${serviceToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falha ao excluir o serviço.");
      closeDeleteModal();
      fetchServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <p>Carregando serviços...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Lista de Serviços</h2>
          <button
            onClick={openCreateModal}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Adicionar Serviço
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border-b text-left">Nome</th>
                <th className="py-2 px-4 border-b text-left">Duração</th>
                <th className="py-2 px-4 border-b text-left">Preço</th>
                <th className="py-2 px-4 border-b text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.length > 0 ? (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{service.name}</td>
                    <td className="py-2 px-4 border-b">
                      {service.duration} min
                    </td>
                    <td className="py-2 px-4 border-b">
                      R$ {Number(service.price).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => openEditModal(service)}
                        className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openDeleteModal(service)}
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
                    colSpan={4}
                    className="py-4 px-4 text-center text-gray-500"
                  >
                    Nenhum serviço encontrado.
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
        title={editingService ? "Editar Serviço" : "Adicionar Novo Serviço"}
      >
        <ServiceForm onSuccess={handleFormSuccess} service={editingService} />
      </Modal>

      <Modal
        isOpen={!!serviceToDelete}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão"
      >
        {serviceToDelete && (
          <div>
            <p>
              Você tem certeza que deseja excluir o serviço{" "}
              <strong>{serviceToDelete.name}</strong>?
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
                {isDeleting ? "Excluindo..." : "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

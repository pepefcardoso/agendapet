"use client";

import { useEffect, useState } from "react";
import { ClientForm } from "./ClientForm";
import { Modal } from "@/components/ui/Modal";

type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  whatsapp: string | null;
};

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchClients() {
    try {
      setLoading(true);
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Falha ao buscar os clientes.");
      const data = await response.json();
      setClients(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, []);

  const openCreateModal = () => {
    setEditingClient(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingClient(null);
  };

  const handleFormSuccess = () => {
    closeFormModal();
    fetchClients();
  };

  const openDeleteModal = (client: Client) => {
    setClientToDelete(client);
  };

  const closeDeleteModal = () => {
    setClientToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Falha ao excluir o cliente.");
      }

      closeDeleteModal();
      fetchClients();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <p>Carregando clientes...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Lista de Clientes</h2>
          <button
            onClick={openCreateModal}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Adicionar Cliente
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border-b text-left">Nome</th>
                <th className="py-2 px-4 border-b text-left">Telefone</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{client.name}</td>
                    <td className="py-2 px-4 border-b">{client.phone}</td>
                    <td className="py-2 px-4 border-b">
                      {client.email || "N/A"}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => openEditModal(client)}
                        className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openDeleteModal(client)}
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
                    Nenhum cliente encontrado.
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
        title={editingClient ? "Editar Cliente" : "Adicionar Novo Cliente"}
      >
        <ClientForm onSuccess={handleFormSuccess} client={editingClient} />
      </Modal>

      <Modal
        isOpen={!!clientToDelete}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão"
      >
        {clientToDelete && (
          <div>
            <p>
              Você tem certeza que deseja excluir o cliente{" "}
              <strong>{clientToDelete.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              Esta ação não pode ser desfeita.
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

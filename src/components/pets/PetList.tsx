"use client";

import { useEffect, useState } from "react";
import { PetForm } from "./PetForm";
import { PetSize } from "@prisma/client";
import { Modal } from "@/components/ui/Modal";

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  size: PetSize;
  notes: string | null;
  clientId: string;
  client: { name: string };
};

export function PetList() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchPets() {
    try {
      setLoading(true);
      const response = await fetch("/api/pets");
      if (!response.ok) throw new Error("Falha ao buscar os pets.");
      const data = await response.json();
      setPets(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPets();
  }, []);

  const openCreateModal = () => {
    setEditingPet(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (pet: Pet) => {
    setEditingPet(pet);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingPet(null);
  };

  const handleFormSuccess = () => {
    closeFormModal();
    fetchPets();
  };

  const openDeleteModal = (pet: Pet) => {
    setPetToDelete(pet);
  };

  const closeDeleteModal = () => {
    setPetToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!petToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pets/${petToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falha ao excluir o pet.");
      closeDeleteModal();
      fetchPets();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <p>Carregando pets...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Lista de Pets</h2>
          <button
            onClick={openCreateModal}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Adicionar Pet
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border-b text-left">Nome do Pet</th>
                <th className="py-2 px-4 border-b text-left">Dono</th>
                <th className="py-2 px-4 border-b text-left">Porte</th>
                <th className="py-2 px-4 border-b text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pets.length > 0 ? (
                pets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{pet.name}</td>
                    <td className="py-2 px-4 border-b">{pet.client.name}</td>
                    <td className="py-2 px-4 border-b">{pet.size}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => openEditModal(pet)}
                        className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openDeleteModal(pet)}
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
                    Nenhum pet encontrado.
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
        title={editingPet ? "Editar Pet" : "Adicionar Novo Pet"}
      >
        <PetForm onSuccess={handleFormSuccess} pet={editingPet} />
      </Modal>

      <Modal
        isOpen={!!petToDelete}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão"
      >
        {petToDelete && (
          <div>
            <p>
              Você tem certeza que deseja excluir o pet{" "}
              <strong>{petToDelete.name}</strong>?
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

"use client";

import { useState, useEffect } from "react";
import { PetSize } from "@prisma/client";

type Client = { id: string; name: string };
type Pet = {
  id: string;
  name: string;
  breed: string | null;
  size: PetSize;
  notes: string | null;
  clientId: string;
};
type PetFormProps = { pet?: Pet | null; onSuccess: () => void };

export function PetForm({ pet, onSuccess }: PetFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    size: "" as PetSize | "",
    breed: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch("/api/clients");
        const data = await response.json();
        setClients(data);
      } catch (e) {
        console.error("Falha ao buscar clientes", e);
      }
    }
    fetchClients();
  }, []);

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name,
        clientId: pet.clientId,
        size: pet.size,
        breed: pet.breed || "",
        notes: pet.notes || "",
      });
    }
  }, [pet]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.size) {
      setError("Por favor, selecione o dono e o porte do pet.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const url = pet ? `/api/pets/${pet.id}` : "/api/pets";
    const method = pet ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao salvar o pet.");
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
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>
      )}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="clientId"
            className="block text-sm font-medium text-gray-700"
          >
            Dono do Pet
          </label>
          <select
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="" disabled>
              Selecione um cliente
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nome do Pet
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="breed"
              className="block text-sm font-medium text-gray-700"
            >
              Raça (Opcional)
            </label>
            <input
              type="text"
              name="breed"
              id="breed"
              value={formData.breed}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="size"
              className="block text-sm font-medium text-gray-700"
            >
              Porte
            </label>
            <select
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="" disabled>
                Selecione o porte
              </option>
              {Object.values(PetSize).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Observações (Opcional)
          </label>
          <textarea
            name="notes"
            id="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
        >
          {submitting ? "Salvando..." : "Salvar Pet"}
        </button>
      </div>
    </form>
  );
}

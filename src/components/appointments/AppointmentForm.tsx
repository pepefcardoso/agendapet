"use client";

import { useState, useEffect } from "react";
import { Service, Client, Pet, Appointment } from "@prisma/client";

export type AppointmentFormValues = Partial<
  Appointment & {
    services?: { id: string }[];
  }
>;

type ClientWithPets = Client & { pets: Pet[] };

type AppointmentFormProps = {
  appointment?: AppointmentFormValues | null;
  onSuccess: () => void;
};

export function AppointmentForm({
  appointment,
  onSuccess,
}: AppointmentFormProps) {
  const [clients, setClients] = useState<ClientWithPets[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [formData, setFormData] = useState({
    clientId: "",
    petId: "",
    serviceIds: [] as string[],
    date: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const clientsResponse = await fetch("/api/clients?includePets=true");
        const clientsData = await clientsResponse.json();
        setClients(clientsData);

        const servicesResponse = await fetch("/api/services");
        const servicesData = await servicesResponse.json();
        setServices(servicesData);
      } catch (e) {
        console.error("Falha ao buscar dados para o formulário", e);
        setError("Não foi possível carregar os dados necessários.");
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (appointment) {
      setFormData({
        clientId: appointment.clientId ?? "",
        petId: appointment.petId ?? "",
        serviceIds: appointment.services?.map((s) => s.id) ?? [],
        date: appointment.date
          ? new Date(appointment.date).toISOString().slice(0, 16)
          : "",
        notes: appointment.notes || "",
      });

      if (appointment.clientId) {
        const client = clients.find((c) => c.id === appointment.clientId);
        if (client) setPets(client.pets);
      }
    } else {
      setFormData({
        clientId: "",
        petId: "",
        serviceIds: [],
        date: "",
        notes: "",
      });
    }
  }, [appointment, clients]);

  useEffect(() => {
    if (formData.clientId) {
      const selectedClient = clients.find((c) => c.id === formData.clientId);
      setPets(selectedClient ? selectedClient.pets : []);
      if (
        formData.petId &&
        !clients
          .find((c) => c.id === formData.clientId)
          ?.pets.some((p) => p.id === formData.petId)
      ) {
        setFormData((prev) => ({ ...prev, petId: "" }));
      }
    }
  }, [formData.clientId, clients, formData.petId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, serviceIds: selectedOptions }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const url = appointment?.id
      ? `/api/appointments/${appointment.id}`
      : "/api/appointments";
    const method = appointment?.id ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao salvar o agendamento.");
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
            Cliente
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
            htmlFor="petId"
            className="block text-sm font-medium text-gray-700"
          >
            Pet
          </label>
          <select
            id="petId"
            name="petId"
            value={formData.petId}
            onChange={handleChange}
            required
            disabled={!formData.clientId}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
          >
            <option value="" disabled>
              Selecione um pet
            </option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="serviceIds"
            className="block text-sm font-medium text-gray-700"
          >
            Serviços
          </label>
          <select
            id="serviceIds"
            name="serviceIds"
            multiple
            value={formData.serviceIds}
            onChange={handleServiceChange}
            required
            className="mt-1 block w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700"
          >
            Data e Hora
          </label>
          <input
            type="datetime-local"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
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
          {submitting ? "Salvando..." : "Salvar Agendamento"}
        </button>
      </div>
    </form>
  );
}

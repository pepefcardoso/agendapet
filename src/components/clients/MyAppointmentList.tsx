"use client";

import { useEffect, useState } from "react";
import { Appointment } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ClientAppointment = Appointment & {
  pet: { name: string };
  services: { name: string; price: number }[];
};

const MOCKED_CLIENT_ID = "clv3xoz8k000108l4f4v1e2k1";

export function MyAppointmentList() {
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/clients/${MOCKED_CLIENT_ID}/appointments`
      );
      if (!response.ok) throw new Error("Falha ao buscar seus agendamentos.");
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falha ao cancelar o agendamento.");
      setAppointments((prev) => prev.filter((app) => app.id !== appointmentId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ocorreu um erro.");
    }
  };

  const canCancel = (appointmentDate: Date): boolean => {
    const now = new Date();
    const appointmentTime = new Date(appointmentDate).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return appointmentTime - now.getTime() > twentyFourHours;
  };

  if (loading)
    return <p className="text-center">Carregando seus agendamentos...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="space-y-6">
      {appointments.length > 0 ? (
        appointments.map((app) => (
          <div
            key={app.id}
            className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500"
          >
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <p className="text-xl font-bold text-gray-800">
                  {app.pet.name}
                </p>
                <p className="text-gray-600">
                  {app.services.map((s) => s.name).join(", ")}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Status: <span className="font-semibold">{app.status}</span>
                </p>
              </div>
              <div className="text-left md:text-right mt-4 md:mt-0">
                <p className="text-lg font-semibold">
                  {format(new Date(app.date), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-gray-700">
                  às {format(new Date(app.date), "HH:mm")}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex justify-end">
              {canCancel(app.date) &&
              app.status !== "COMPLETED" &&
              app.status !== "CANCELLED" ? (
                <button
                  onClick={() => handleCancel(app.id)}
                  className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
                >
                  Cancelar Agendamento
                </button>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Cancelamento não disponível.
                </p>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">
          Você ainda não tem agendamentos.
        </p>
      )}
    </div>
  );
}

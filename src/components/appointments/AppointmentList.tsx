"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Appointment } from "@prisma/client";
import { AppointmentForm, AppointmentFormValues } from "./AppointmentForm";
import { Modal } from "../ui/modal";
import { Calendar, Views, Event } from "react-big-calendar";
import { localizer } from "@/lib/calendarLocalizer";
import "react-big-calendar/lib/css/react-big-calendar.css";

type FullAppointment = Appointment & {
  client: { name: string };
  pet: { name: string };
  services: { name: string; id: string; duration: number }[];
};

export function AppointmentList() {
  const [appointments, setAppointments] = useState<FullAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<FullAppointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<FullAppointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newAppointmentDate, setNewAppointmentDate] = useState<Date | null>(
    null
  );

  async function fetchAppointments() {
    try {
      setLoading(true);
      const response = await fetch("/api/appointments");
      if (!response.ok) throw new Error("Falha ao buscar os agendamentos.");
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

  const events: Event[] = useMemo(() => {
    return appointments.map((app) => {
      const start = new Date(app.date);
      const totalDuration = app.services.reduce(
        (acc, s) => acc + s.duration,
        0
      );
      const end = new Date(start.getTime() + totalDuration * 60000);
      return {
        title: `${app.pet.name} (${app.client.name}) - ${app.services
          .map((s) => s.name)
          .join(", ")}`,
        start,
        end,
        resource: app,
      };
    });
  }, [appointments]);

  const openCreateModal = () => {
    setEditingAppointment(null);
    setIsFormModalOpen(true);
  };

  const handleSelectEvent = useCallback((event: Event) => {
    setEditingAppointment(event.resource as FullAppointment);
    setIsFormModalOpen(true);
  }, []);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setNewAppointmentDate(start);
    setEditingAppointment(null);
    setIsFormModalOpen(true);
  }, []);

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingAppointment(null);
    setNewAppointmentDate(null);
  };

  const handleFormSuccess = () => {
    closeFormModal();
    fetchAppointments();
  };

  const closeDeleteModal = () => {
    setAppointmentToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/appointments/${appointmentToDelete.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Falha ao excluir o agendamento.");
      closeDeleteModal();
      fetchAppointments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setIsDeleting(false);
    }
  };

  const initialFormValues: AppointmentFormValues | null = useMemo(() => {
    if (editingAppointment) {
      return {
        ...editingAppointment,
        services: editingAppointment.services.map((s) => ({ id: s.id })),
      };
    }
    if (newAppointmentDate) {
      return {
        date: newAppointmentDate,
        services: [],
      };
    }
    return null;
  }, [editingAppointment, newAppointmentDate]);

  if (loading) return <p>Carregando agendamentos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6 h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Calendário de Agendamentos</h2>
          <button
            onClick={openCreateModal}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Agendar Serviço
          </button>
        </div>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          style={{ height: "calc(100% - 50px)" }}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
          }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
        />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}
      >
        <AppointmentForm
          onSuccess={handleFormSuccess}
          appointment={initialFormValues}
        />
      </Modal>

      <Modal
        isOpen={!!appointmentToDelete}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão"
      >
        {appointmentToDelete && (
          <div>
            <p>
              Você tem certeza que deseja excluir o agendamento para{" "}
              <strong>{appointmentToDelete.pet.name}</strong> de{" "}
              <strong>{appointmentToDelete.client.name}</strong>?
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

import { AppointmentList } from "@/components/appointments/AppointmentList";

export default function AppointmentsPage() {
  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestão de Agendamentos</h1>
      </header>
      <AppointmentList />
    </div>
  );
}

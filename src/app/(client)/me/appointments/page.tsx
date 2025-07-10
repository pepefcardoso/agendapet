import { MyAppointmentList } from "@/components/clients/MyAppointmentList";

export default function MyAccountPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Meus Agendamentos</h1>
        <p className="mt-1 text-gray-600">
          Visualize e gerencie seus próximos serviços.
        </p>
      </header>
      <MyAppointmentList />
    </div>
  );
}

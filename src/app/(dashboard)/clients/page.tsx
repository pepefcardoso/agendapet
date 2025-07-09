import { ClientList } from "../../../components/clients/ClientList";

export default function ClientsPage() {
  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
      </header>
      <ClientList />
    </div>
  );
}

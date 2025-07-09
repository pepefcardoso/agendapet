import { ServiceList } from "@/components/services/ServiceList";

export default function ServicesPage() {
  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestão de Serviços</h1>
      </header>
      <ServiceList />
    </div>
  );
}

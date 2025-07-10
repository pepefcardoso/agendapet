import { MySubscriptionDetails } from "@/components/clients/MySubscriptionDetails";

export default function MySubscriptionPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Minha Assinatura</h1>
        <p className="mt-1 text-gray-600">
          Acompanhe o status do seu plano e seus créditos disponíveis.
        </p>
      </header>
      <MySubscriptionDetails />
    </div>
  );
}

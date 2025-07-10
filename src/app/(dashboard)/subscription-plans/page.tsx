import { SubscriptionPlanList } from "@/components/subscriptions/SubscriptionPlanList";

export default function SubscriptionPlansPage() {
  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestão de Planos de Assinatura</h1>
      </header>
      <SubscriptionPlanList />
    </div>
  );
}

import { PaymentHistoryList } from "../../../../components/clients/PaymentHistoryList";

export default function PaymentsPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Histórico de Pagamentos
        </h1>
        <p className="mt-1 text-gray-600">
          Consulte todos os seus pagamentos realizados.
        </p>
      </header>
      <PaymentHistoryList />
    </div>
  );
}

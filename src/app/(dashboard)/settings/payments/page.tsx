import { PaymentSettingsForm } from "../../../../components/admin/PaymentSettingsForm";

export default function PaymentSettingsPage() {
  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Configurações de Pagamento</h1>
      </header>
      <p className="mb-4">
        Insira aqui as suas credenciais do Mercado Pago para habilitar os
        pagamentos online.
      </p>
      <PaymentSettingsForm />
    </div>
  );
}

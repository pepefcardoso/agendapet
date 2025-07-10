function ClientNav() {
  return (
    <div className="flex space-x-4">
      <a
        href="/me/appointments"
        className="text-gray-600 hover:text-blue-600 font-medium"
      >
        Meus Agendamentos
      </a>
      <a
        href="/me/subscription"
        className="text-gray-600 hover:text-blue-600 font-medium"
      >
        Minha Assinatura
      </a>
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Minha Conta</h1>
          <ClientNav />
        </nav>
      </header>
      <main className="container mx-auto p-4 md:p-8">{children}</main>
    </div>
  );
}

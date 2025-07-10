import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">AgendaPet</h1>
        <p className="text-gray-600">A sua plataforma de gestão de pet shop</p>
      </div>
      <LoginForm />
    </div>
  );
}

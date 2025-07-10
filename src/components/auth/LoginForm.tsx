"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [authType, setAuthType] = useState<"admin" | "client">("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleAdminSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials-user", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Credenciais de administrador inválidas.");
    } else {
      router.push("/appointments");
    }
    setLoading(false);
  };

  const handleRequestCode = async (phone: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/request-access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao solicitar código."
      );
    }
    setLoading(false);
  };

  const handleClientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const phone = formData.get("phone") as string;
    const accessCode = formData.get("accessCode") as string;

    const result = await signIn("credentials-client", {
      redirect: false,
      phone,
      accessCode,
    });

    if (result?.error) {
      setError("Telefone ou código de acesso inválido.");
    } else {
      router.push("/me/appointments");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setAuthType("admin")}
          className={`flex-1 py-2 text-center font-semibold ${
            authType === "admin"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Sou Administrador
        </button>
        <button
          onClick={() => setAuthType("client")}
          className={`flex-1 py-2 text-center font-semibold ${
            authType === "client"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Sou Cliente
        </button>
      </div>

      <div className="p-4 sm:p-8 bg-white shadow-md rounded-b-lg">
        {error && (
          <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>
        )}
        {message && (
          <p className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {message}
          </p>
        )}

        {authType === "admin" ? (
          <form onSubmit={handleAdminSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
            >
              {loading ? "A entrar..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleClientSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Nº de WhatsApp
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const phoneInput = e.currentTarget
                      .previousSibling as HTMLInputElement;
                    if (phoneInput.value) handleRequestCode(phoneInput.value);
                  }}
                  disabled={loading}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded disabled:bg-gray-100"
                >
                  {loading ? "..." : "Pedir Código"}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="accessCode"
                className="block text-sm font-medium text-gray-700"
              >
                Código de Acesso
              </label>
              <input
                type="text"
                name="accessCode"
                id="accessCode"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
            >
              {loading ? "A entrar..." : "Entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

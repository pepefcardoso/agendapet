"use client";

import { useState, useEffect } from "react";
import { PaymentSettings } from "@prisma/client";

export function PaymentSettingsForm() {
  const [settings, setSettings] = useState<Partial<PaymentSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const response = await fetch("/api/settings/payments");
        const data = await response.json();
        if (response.ok) {
          setSettings(data);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
        setMessage({ text: "Erro ao carregar configurações.", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/settings/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Falha ao salvar.");
      }
      setMessage({
        text: "Configurações salvas com sucesso!",
        type: "success",
      });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Ocorreu um erro.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg bg-white p-6 rounded-lg shadow-md"
    >
      {message && (
        <p
          className={`p-3 rounded-md mb-4 text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="mercadoPagoAccessToken"
            className="block text-sm font-medium text-gray-700"
          >
            Mercado Pago - Access Token
          </label>
          <input
            type="password"
            name="mercadoPagoAccessToken"
            id="mercadoPagoAccessToken"
            value={settings.mercadoPagoAccessToken || ""}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="APP_USR-..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Seu token de acesso privado. Ele será armazenado de forma segura.
          </p>
        </div>
        {/* Você pode adicionar o campo para o Webhook Secret aqui também */}
      </div>
      <div className="mt-6">
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-blue-300"
        >
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </form>
  );
}

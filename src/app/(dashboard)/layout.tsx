import { auth } from "@/../auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <p>AgendaPet</p>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

import type { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}

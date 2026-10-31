import type { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // スマホでは左の縦メニューが本文の幅を半分以上奪うので、上の横並びメニューにする
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--brand-text)] md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}

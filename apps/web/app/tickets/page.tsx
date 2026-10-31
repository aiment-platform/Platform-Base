import type { Metadata } from "next";
import { TicketsPageClient } from "./TicketsPageClient";

export const metadata: Metadata = { title: "マイチケット" };

export default function TicketsPage() {
  return <TicketsPageClient />;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/home/TopNav";
import { MySessionsManager } from "../../components/channel/MySessionsManager";
import { useUserSession } from "../../lib/userSession";

export default function StudioSessionsPage() {
  const router = useRouter();
  const { isVtuber, hydrated } = useUserSession();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hydrated) return;
    if (!isVtuber) {
      router.replace("/");
      return;
    }
  }, [hydrated, isVtuber]);

  if (!hydrated || !isVtuber) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--brand-text)]">
      <TopNav mode="studio" />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <MySessionsManager />
      </main>
    </div>
  );
}

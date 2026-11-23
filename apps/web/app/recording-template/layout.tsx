import type { Metadata } from "next";

// LiveKit の録画用ブラウザだけが開く画面。検索エンジンには載せない
export const metadata: Metadata = {
  title: "recording",
  robots: { index: false, follow: false },
};

export default function RecordingTemplateLayout({ children }: { children: React.ReactNode }) {
  return children;
}

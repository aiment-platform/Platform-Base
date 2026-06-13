export async function uploadImageToR2(
  file: File,
  folder: "thumbnails" | "avatars" | "headers",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/uploads", { method: "POST", body: formData });
  const data = (await res.json()) as { url?: string; error?: string };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "アップロードに失敗しました");
  }
  return data.url;
}

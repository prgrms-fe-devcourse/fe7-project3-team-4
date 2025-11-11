import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "posts";

function getFileExt(file: File) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()! : "png";
}

function buildPath(kind: "main" | "result", userId: string, file: File) {
  const ext = getFileExt(file);
  const fileName = `${crypto.randomUUID()}.${ext}`;
  return `${kind}/${userId}/${fileName}`;
}

async function uploadAndGetPublicUrl(
  supabase: SupabaseClient,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Storage upload error:", error);
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function uploadPostMainImage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  const path = buildPath("main", userId, file);
  return uploadAndGetPublicUrl(supabase, path, file);
}

export async function uploadPromptResultImage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  const path = buildPath("result", userId, file);
  return uploadAndGetPublicUrl(supabase, path, file);
}

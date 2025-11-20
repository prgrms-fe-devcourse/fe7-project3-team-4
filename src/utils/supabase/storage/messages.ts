import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "messages";

function getFileExt(file: File) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()! : "png";
}

function buildMessagePath(roomId: string, file: File) {
  const ext = getFileExt(file);
  const fileName = `${crypto.randomUUID()}.${ext}`;
  return `${roomId}/${fileName}`;
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

export default async function uploadImageMessage(
  supabase: SupabaseClient,
  roomId: string,
  file: File
): Promise<string> {
  const path = buildMessagePath(roomId, file);
  return uploadAndGetPublicUrl(supabase, path, file);
}

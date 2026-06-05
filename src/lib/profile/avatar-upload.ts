import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadProfileAvatar(userId: string, file: File) {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return { error: "Use a JPG, PNG, or WebP image" as const };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be 2MB or smaller" as const };
  }

  const ext = EXT_BY_TYPE[file.type] ?? "jpg";
  const path = `${userId}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const service = createServiceClient();

  const { error: uploadError } = await service.storage
    .from("avatars")
    .upload(path, buffer, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: urlData } = service.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await service
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (profileError) {
    return { error: profileError.message };
  }

  return { avatarUrl };
}

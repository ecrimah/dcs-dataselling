"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProfilePhotoFieldProps {
  initials: string;
  avatarUrl: string | null;
  uploadUrl: string;
  onUploaded: (url: string) => void;
  className?: string;
}

export function ProfilePhotoField({
  initials,
  avatarUrl,
  uploadUrl,
  onUploaded,
  className,
}: ProfilePhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(avatarUrl);
  }, [avatarUrl]);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Use a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 2MB or smaller");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(uploadUrl, { method: "POST", body: form });
      const data = (await res.json()) as { avatarUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not upload photo");
      if (!data.avatarUrl) throw new Error("Upload did not return a photo URL");

      setPreview(data.avatarUrl);
      onUploaded(data.avatarUrl);
      toast.success("Profile photo updated");
    } catch (e) {
      setPreview(avatarUrl);
      toast.error(e instanceof Error ? e.message : "Could not upload photo");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Profile"
            className="h-24 w-24 rounded-full border-2 border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-2xl font-bold text-slate-600">
            {initials}
          </div>
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-white shadow-md transition hover:bg-amber-400 disabled:opacity-60"
          aria-label="Upload profile photo"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-center text-xs text-slate-500">JPG, PNG or WebP · max 2MB</p>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Camera, FileImage, Upload, X, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StoreFormState } from "../wizard";

interface Props {
  form: StoreFormState;
  update: <K extends keyof StoreFormState>(k: K, v: StoreFormState[K]) => void;
}

export function StepKyc({ form, update }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Verify your identity</h2>
        <p className="mt-1 text-sm text-muted">
          We verify every vendor to keep DCS trustworthy. Takes 24h max.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-cyan-500/5 p-3 text-xs text-muted">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
        <p>
          Your documents are encrypted and only viewed by our compliance team.
          Required by Bank of Ghana for digital commerce platforms.
        </p>
      </div>

      <Input
        label="Ghana Card number"
        placeholder="GHA-XXXXXXXXX-X"
        value={form.ghanaCardNumber}
        onChange={(e) => update("ghanaCardNumber", e.target.value.toUpperCase())}
      />

      <FileUpload
        label="Ghana Card — Front"
        file={form.ghanaCardFront}
        onChange={(f) => update("ghanaCardFront", f)}
        icon={FileImage}
      />
      <FileUpload
        label="Ghana Card — Back"
        file={form.ghanaCardBack}
        onChange={(f) => update("ghanaCardBack", f)}
        icon={FileImage}
      />
      <FileUpload
        label="Selfie holding your Ghana Card"
        file={form.selfie}
        onChange={(f) => update("selfie", f)}
        icon={Camera}
        capture
      />
    </div>
  );
}

function FileUpload({
  label,
  file,
  onChange,
  icon: Icon,
  capture,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  icon: React.ComponentType<{ className?: string }>;
  capture?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function pick(f: File | null) {
    onChange(f);
    if (f && f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      {file ? (
        <div className="relative flex items-center gap-3 rounded-xl border border-border bg-slate-50 p-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={label} className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-500/10">
              <Icon className="h-6 w-6 text-cyan-600" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={() => pick(null)}
            className="rounded-lg p-1.5 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={cn(
            "flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-slate-50 text-sm text-muted transition-colors",
            "hover:border-cyan-500 hover:bg-cyan-500/5 hover:text-cyan-700",
          )}
        >
          <Upload className="h-5 w-5" />
          Tap to upload
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture={capture ? "user" : undefined}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

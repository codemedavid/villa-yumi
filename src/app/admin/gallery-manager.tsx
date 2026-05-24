"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  uploadGalleryAction,
  deleteGalleryAction,
  type AdminState,
} from "@/server/actions/admin";
import type { GalleryImage } from "@/lib/villa";

const initial: AdminState = { ok: false };

export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const [state, action, pending] = useActionState(uploadGalleryAction, initial);
  const usingDefaults = images.some((i) => i.id.startsWith("static-"));

  return (
    <div>
      {usingDefaults && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Showing the built-in starter photos. Run the latest <code>supabase/schema.sql</code> once
          so these become editable, or just upload your own below — uploads always save.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            {!img.id.startsWith("static-") && (
              <form action={deleteGalleryAction} className="absolute right-1.5 top-1.5">
                <input type="hidden" name="id" value={img.id} />
                <button
                  type="submit"
                  aria-label="Delete photo"
                  className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      <form action={action} className="mt-4 flex flex-wrap items-center gap-3">
        <Input
          type="file"
          name="images"
          accept="image/*"
          multiple
          required
          className="max-w-xs"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Uploading…" : "Add photos"}
        </Button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state.ok && state.message && <span className="text-sm text-emerald-600">{state.message}</span>}
      </form>
    </div>
  );
}

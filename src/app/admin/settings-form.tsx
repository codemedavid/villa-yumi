"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingsAction, type AdminState } from "@/server/actions/admin";
import type { Settings } from "@/lib/villa";

const initial: AdminState = { ok: false };

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(updateSettingsAction, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="GCash account name" name="gcash_name" defaultValue={settings.gcash_name ?? ""} />
        <Field label="GCash number" name="gcash_number" defaultValue={settings.gcash_number ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gcash_qr">GCash QR image {settings.gcash_qr_url ? "(replace)" : ""}</Label>
        <Input id="gcash_qr" name="gcash_qr" type="file" accept="image/*" />
        {settings.gcash_qr_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.gcash_qr_url} alt="Current GCash QR" className="mt-2 h-28 w-28 rounded border object-contain p-1" />
        )}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && state.message && <p className="text-sm text-emerald-600">{state.message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} />
    </div>
  );
}

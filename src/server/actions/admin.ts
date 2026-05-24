"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import {
  checkPassword,
  setAdminCookie,
  clearAdminCookie,
  isAdmin,
} from "@/lib/admin-auth";

export type AdminState = { ok: boolean; error?: string; message?: string };

export async function adminLoginAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { ok: false, error: "Wrong password." };
  }
  await setAdminCookie();
  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await clearAdminCookie();
  redirect("/admin");
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorized");
}

export async function setBookingStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["pending", "confirmed", "cancelled"].includes(status)) return;

  await supabase.from("bookings").update({ status }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateSettingsAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const update: Record<string, unknown> = {
    gcash_name: String(formData.get("gcash_name") ?? "") || null,
    gcash_number: String(formData.get("gcash_number") ?? "") || null,
  };

  // Optional QR image upload.
  const qr = formData.get("gcash_qr");
  if (qr instanceof File && qr.size > 0) {
    const ext = qr.name.split(".").pop()?.toLowerCase() || "png";
    const path = `qr/gcash-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, qr, { contentType: qr.type || "image/png", upsert: true });
    if (upErr) return { ok: false, error: "QR upload failed: " + upErr.message };
    update.gcash_qr_url = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("settings").update(update).eq("id", 1);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}

// ---- Gallery management --------------------------------------------------

export async function uploadGalleryAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: "Choose at least one image." };

  // Next position = current max + 1.
  const { data: last } = await supabase
    .from("gallery")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  let position = (last?.position ?? -1) + 1;

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
    if (upErr) return { ok: false, error: "Upload failed: " + upErr.message };
    const url = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
    const { error: insErr } = await supabase.from("gallery").insert({ url, position });
    if (insErr) return { ok: false, error: insErr.message };
    position++;
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: `Added ${files.length} photo${files.length > 1 ? "s" : ""}.` };
}

// ---- Manual availability (close / reserve / open dates) ------------------

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function setDatesAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!ISO.test(from) || !ISO.test(to)) return;
  if (!["closed", "reserved", "open"].includes(status)) return;

  // Inclusive list of dates from `from` to `to`.
  const dates: string[] = [];
  const d = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (d <= end) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
    if (dates.length > 366) break; // safety
  }
  if (dates.length === 0) return;

  if (status === "open") {
    await supabase.from("date_blocks").delete().in("date", dates);
  } else {
    const rows = dates.map((date) => ({ date, status, note }));
    await supabase.from("date_blocks").upsert(rows, { onConflict: "date" });
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteGalleryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Look up the URL so we can also remove the stored file (skip static seeds).
  const { data } = await supabase.from("gallery").select("url").eq("id", id).maybeSingle();
  await supabase.from("gallery").delete().eq("id", id);

  const url = data?.url as string | undefined;
  if (url && url.includes(`/${STORAGE_BUCKET}/`)) {
    const path = url.split(`/${STORAGE_BUCKET}/`)[1];
    if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

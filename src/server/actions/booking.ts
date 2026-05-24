"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import { hasOverlap, hasBlockedDate } from "@/lib/villa";
import { quote, MAX_GUESTS } from "@/lib/pricing";
import { bookingSchema } from "@/lib/validations/booking";
import { generateConfirmationCode } from "@/lib/utils";

export type BookingState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createBookingAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse({
    checkIn: formData.get("checkIn"),
    checkOut: formData.get("checkOut"),
    guests: formData.get("guests"),
    guestName: formData.get("guestName"),
    guestEmail: formData.get("guestEmail"),
    guestPhone: formData.get("guestPhone"),
    gcashReference: formData.get("gcashReference"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { checkIn, checkOut, guests, guestName, guestEmail, guestPhone, gcashReference } =
    parsed.data;

  // Recompute everything server-side — never trust the client.
  const { nights, total, hasClosedDay } = quote(checkIn, checkOut, guests);
  if (nights < 1) return { ok: false, error: "Stay must be at least 1 night." };
  if (guests > MAX_GUESTS) return { ok: false, error: `Maximum ${MAX_GUESTS} guests online — message us for more.` };
  if (hasClosedDay) return { ok: false, error: "Villa Yumi is closed on Tuesdays — please adjust your dates." };

  // Authoritative double-booking guard.
  if (await hasOverlap(checkIn, checkOut)) {
    return { ok: false, error: "Those dates were just booked. Please pick a different range." };
  }
  if (await hasBlockedDate(checkIn, checkOut)) {
    return { ok: false, error: "Some of those dates are unavailable. Please pick a different range." };
  }

  // Payment screenshot is required — guests pay via GCash before booking.
  const proof = formData.get("paymentProof");
  if (!(proof instanceof File) || proof.size === 0) {
    return {
      ok: false,
      error: "Please upload your GCash payment screenshot to confirm your booking.",
      fieldErrors: { paymentProof: ["Payment screenshot is required."] },
    };
  }
  if (!proof.type.startsWith("image/")) {
    return { ok: false, fieldErrors: { paymentProof: ["Please upload an image file."] } };
  }

  const ext = proof.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `proofs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, proof, { contentType: proof.type || "image/jpeg", upsert: false });
  if (upErr) {
    return { ok: false, error: "Couldn't upload your screenshot. Please try again." };
  }
  const paymentProofUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;

  const confirmationCode = generateConfirmationCode();

  const { error } = await supabase.from("bookings").insert({
    guest_name: guestName,
    guest_email: guestEmail,
    guest_phone: guestPhone,
    check_in: checkIn,
    check_out: checkOut,
    nights,
    guests,
    total,
    confirmation_code: confirmationCode,
    gcash_reference: gcashReference,
    payment_proof_url: paymentProofUrl,
    status: "pending",
  });

  if (error) {
    console.error("Booking insert failed:", error);
    return { ok: false, error: "Something went wrong saving your booking. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/booking/success?code=${confirmationCode}`);
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBookingAction, type BookingState } from "@/server/actions/booking";

const initial: BookingState = { ok: false };

export function CheckoutForm(props: {
  checkIn: string;
  checkOut: string;
  guests: number;
  gcash: { name: string | null; number: string | null; qrUrl: string | null };
}) {
  const [state, formAction, pending] = useActionState(createBookingAction, initial);
  const fe = state.fieldErrors ?? {};
  const hasGcash = props.gcash.number || props.gcash.qrUrl;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="checkIn" value={props.checkIn} />
      <input type="hidden" name="checkOut" value={props.checkOut} />
      <input type="hidden" name="guests" value={props.guests} />

      {/* Step 1 — your details */}
      <div className="space-y-4 rounded-2xl border p-5">
        <h2 className="font-semibold">1 · Your details</h2>
        <Field label="Full name" name="guestName" error={fe.guestName} required />
        <Field label="Email" name="guestEmail" type="email" error={fe.guestEmail} required />
        <Field label="Phone number" name="guestPhone" type="tel" error={fe.guestPhone} required />
      </div>

      {/* Step 2 — pay via GCash */}
      <div className="space-y-4 rounded-2xl border p-5">
        <h2 className="font-semibold">2 · Pay via GCash</h2>
        {hasGcash ? (
          <div className="rounded-xl bg-muted/40 p-4 text-sm">
            <p>Send your payment to:</p>
            {props.gcash.name && <p className="mt-1 font-medium">{props.gcash.name}</p>}
            {props.gcash.number && (
              <p className="text-lg font-bold tracking-wide">{props.gcash.number}</p>
            )}
            {props.gcash.qrUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.gcash.qrUrl}
                alt="GCash QR code"
                className="mt-3 h-48 w-48 rounded-lg border bg-white object-contain p-2"
              />
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            Payment details aren&apos;t set up yet. Please contact the owner before paying.
          </p>
        )}

        <Field
          label="GCash reference number"
          name="gcashReference"
          placeholder="e.g. 1234567890123"
          error={fe.gcashReference}
          required
        />
        <div className="space-y-1.5">
          <Label htmlFor="paymentProof" className="text-xs uppercase">
            Payment screenshot <span className="text-brand">*required</span>
          </Label>
          <Input id="paymentProof" name="paymentProof" type="file" accept="image/*" required />
          <p className="text-xs text-muted-foreground">
            Upload a screenshot of your GCash payment so we can confirm your booking.
          </p>
          {fe.paymentProof?.[0] && <p className="text-xs text-red-600">{fe.paymentProof[0]}</p>}
        </div>
      </div>

      {state.error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Submitting…" : "Submit booking"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/#book">Back</Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your booking is held as <strong>pending</strong> until the owner confirms your GCash payment.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs uppercase">{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required={required} />
      {error?.[0] && <p className="text-xs text-red-600">{error[0]}</p>}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Calendar, Users, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { VILLA } from "@/lib/villa";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Booking received" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ code?: string }>;

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { code } = await searchParams;
  if (!code) notFound();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("confirmation_code", code)
    .maybeSingle();

  if (!booking) notFound();

  const c = VILLA.currency;
  const confirmed = booking.status === "confirmed";

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 via-background to-background">
      <div className="container max-w-2xl py-16">
        <div className="text-center animate-fade-in">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Booking received! 🎉
          </h1>
          <p className="mt-3 text-muted-foreground">
            {confirmed
              ? "Your stay is confirmed."
              : "We'll confirm your GCash payment shortly and email you. Keep this page for your records."}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
            <span className="text-muted-foreground">Confirmation code:</span>
            <span className="font-mono font-semibold tracking-wider">{booking.confirmation_code}</span>
          </div>
        </div>

        <Card className="mt-10 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">{VILLA.name}</h2>
              <Badge variant={confirmed ? "success" : "warning"}>
                {confirmed ? "Confirmed" : "Pending payment review"}
              </Badge>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Info icon={Calendar} label="Check-in">{booking.check_in}</Info>
              <Info icon={Calendar} label="Check-out">{booking.check_out}</Info>
              <Info icon={Calendar} label="Nights">{booking.nights}</Info>
              <Info icon={Users} label="Guests">{booking.guests}</Info>
            </div>

            <div className="mt-6 space-y-2 border-t pt-6 text-sm">
              <Row label="Guest" value={booking.guest_name} />
              <Row label="Email" value={booking.guest_email} />
              {booking.guest_phone && <Row label="Phone" value={booking.guest_phone} />}
              {booking.gcash_reference && (
                <Row label="GCash reference" value={booking.gcash_reference} />
              )}
            </div>

            <div className="mt-6 flex justify-between rounded-xl bg-muted/40 p-4 font-semibold">
              <span>Total</span>
              <span>{formatCurrency(Number(booking.total), c)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <Camera className="h-4 w-4" /> Tip: screenshot this page — it&apos;s your receipt.
          </p>
          <Button asChild><Link href="/">Done</Link></Button>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-medium">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

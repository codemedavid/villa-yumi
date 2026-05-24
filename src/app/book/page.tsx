import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "./checkout-form";
import { VILLA, getSettings, hasOverlap, hasBlockedDate } from "@/lib/villa";
import { formatCurrency } from "@/lib/utils";
import { quote, MAX_GUESTS, CURRENCY, CHECK_IN_TIME, CHECK_OUT_TIME } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ in?: string; out?: string; guests?: string }>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function BookPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const checkIn = sp.in ?? "";
  const checkOut = sp.out ?? "";
  const guests = Math.max(1, Math.min(MAX_GUESTS, Number(sp.guests) || 1));

  const valid =
    DATE_RE.test(checkIn) && DATE_RE.test(checkOut) && checkOut > checkIn;

  if (!valid) {
    return (
      <Shell>
        <p className="text-muted-foreground">We couldn&apos;t read your dates.</p>
        <Button asChild className="mt-4"><Link href="/#book">Choose dates</Link></Button>
      </Shell>
    );
  }

  const q = quote(checkIn, checkOut, guests);
  if (q.hasClosedDay) {
    return (
      <Shell>
        <p className="text-amber-800">Villa Yumi is closed on Tuesdays — please choose dates that don&apos;t include a Tuesday.</p>
        <Button asChild className="mt-4"><Link href="/#book">Pick different dates</Link></Button>
      </Shell>
    );
  }

  const [taken, blocked] = await Promise.all([
    hasOverlap(checkIn, checkOut),
    hasBlockedDate(checkIn, checkOut),
  ]);
  if (taken || blocked) {
    return (
      <Shell>
        <p className="text-amber-800">Sorry, those dates aren&apos;t available anymore.</p>
        <Button asChild className="mt-4"><Link href="/#book">Pick different dates</Link></Button>
      </Shell>
    );
  }

  const settings = await getSettings();
  const nights = q.nights;
  const total = q.total;
  const c = CURRENCY;

  return (
    <Shell>
      <h1 className="font-display text-4xl font-semibold">Confirm and pay</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
        <CheckoutForm
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          gcash={{
            name: settings.gcash_name,
            number: settings.gcash_number,
            qrUrl: settings.gcash_qr_url,
          }}
        />

        <Card className="h-fit md:sticky md:top-20">
          <CardContent className="space-y-4 p-5">
            <div className="font-display text-xl font-semibold">{VILLA.name}</div>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> {checkIn} → {checkOut}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" /> {guests} guest{guests > 1 ? "s" : ""}
              </div>
              <div className="text-xs">
                Check-in {CHECK_IN_TIME} · Check-out {CHECK_OUT_TIME}
              </div>
            </div>
            <hr />
            <Row label={`${nights} night${nights > 1 ? "s" : ""} · ${guests} guest${guests > 1 ? "s" : ""}`} value={formatCurrency(total, c)} />
            <div className="flex justify-between border-t pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total, c)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="container flex-1 py-12">{children}</main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

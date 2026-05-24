import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin-auth";
import { listBookings, getSettings, getGallery, getDateBlocks, VILLA, type Booking } from "@/lib/villa";
import { formatCurrency } from "@/lib/utils";
import { adminLogoutAction, setBookingStatusAction } from "@/server/actions/admin";
import { AdminLoginForm } from "./login-form";
import { SettingsForm } from "./settings-form";
import { GalleryManager } from "./gallery-manager";
import { AdminCalendar } from "./admin-calendar";

export const metadata = { title: "Owner admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <div className="grid min-h-dvh place-items-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            <h1 className="font-display text-2xl font-semibold">{VILLA.name} — Owner login</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your admin password.</p>
            <div className="mt-6">
              <AdminLoginForm />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [bookings, settings, gallery, dateBlocks] = await Promise.all([
    listBookings(),
    getSettings(),
    getGallery(),
    getDateBlocks(),
  ]);
  const pending = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="min-h-dvh bg-muted/20">
      <div className="container max-w-5xl py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold">{VILLA.name} — Bookings</h1>
            <p className="text-sm text-muted-foreground">
              {bookings.length} total · {pending} awaiting confirmation
            </p>
          </div>
          <form action={adminLogoutAction}>
            <Button variant="outline" size="sm">Sign out</Button>
          </form>
        </div>

        {/* Availability calendar */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Availability</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select dates to close, reserve, or re-open. Closed and reserved dates can&apos;t be booked by guests.
            </p>
            <div className="mt-4 overflow-x-auto">
              <AdminCalendar bookings={bookings} dateBlocks={dateBlocks} />
            </div>
          </CardContent>
        </Card>

        {/* Bookings */}
        <h2 className="mt-10 text-lg font-semibold">Bookings</h2>
        <div className="mt-3 space-y-3">
          {bookings.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No bookings yet.</CardContent></Card>
          )}
          {bookings.map((b) => (
            <BookingRow key={b.id} b={b} />
          ))}
        </div>

        {/* Gallery */}
        <Card className="mt-10">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Photo gallery</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These show on the home page. Add or remove photos here.
            </p>
            <div className="mt-5">
              <GalleryManager images={gallery} />
            </div>
          </CardContent>
        </Card>

        {/* Payment settings */}
        <Card className="mt-10">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">GCash payment details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Guests see these when they pay. Set your GCash number and upload your QR image.
            </p>
            <div className="mt-5">
              <SettingsForm settings={settings} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BookingRow({ b }: { b: Booking }) {
  const badge =
    b.status === "confirmed" ? "success" : b.status === "cancelled" ? "destructive" : "warning";
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{b.guest_name}</span>
            <Badge variant={badge as "success" | "destructive" | "warning"}>{b.status}</Badge>
            <span className="font-mono text-xs text-muted-foreground">{b.confirmation_code}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {b.check_in} → {b.check_out} · {b.nights} night{b.nights > 1 ? "s" : ""} · {b.guests} guest{b.guests > 1 ? "s" : ""}
          </div>
          <div className="text-sm text-muted-foreground">
            {b.guest_email}{b.guest_phone ? ` · ${b.guest_phone}` : ""}
          </div>
          <div className="text-sm">
            <span className="font-medium">{formatCurrency(b.total, VILLA.currency)}</span>
            {b.gcash_reference && <span className="text-muted-foreground"> · GCash ref {b.gcash_reference}</span>}
          </div>
          {/* GCash payment screenshot — click to view full size */}
          <div className="pt-1">
            {b.payment_proof_url ? (
              <a href={b.payment_proof_url} target="_blank" rel="noopener" className="inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.payment_proof_url}
                  alt="GCash payment proof"
                  className="h-24 w-24 rounded-lg border object-cover transition hover:opacity-90"
                />
                <span className="mt-1 block text-xs text-brand">View payment ↗</span>
              </a>
            ) : (
              <span className="text-xs text-amber-700">No payment screenshot uploaded</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {b.status !== "confirmed" && (
            <form action={setBookingStatusAction}>
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="status" value="confirmed" />
              <Button size="sm">Confirm</Button>
            </form>
          )}
          {b.status !== "cancelled" && (
            <form action={setBookingStatusAction}>
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="status" value="cancelled" />
              <Button size="sm" variant="outline">Cancel</Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

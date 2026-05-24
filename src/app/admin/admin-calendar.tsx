"use client";

import { useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { Lock, BookmarkCheck, CalendarCheck, User } from "lucide-react";
import { isClosedDay } from "@/lib/pricing";
import { toISODate, formatCurrency } from "@/lib/utils";
import { setDatesAction } from "@/server/actions/admin";

type BookingLite = {
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total: number;
  confirmation_code: string;
  payment_proof_url: string | null;
  status: "pending" | "confirmed" | "cancelled";
};
type Block = { date: string; status: "closed" | "reserved"; note: string | null };

// Interactive availability: select dates to Close/Reserve/Open, and click any
// date to see who's on it (guest booking) or why it's blocked.
export function AdminCalendar({
  bookings,
  dateBlocks,
}: {
  bookings: BookingLite[];
  dateBlocks: Block[];
}) {
  const [range, setRange] = useState<DateRange | undefined>();

  const active = useMemo(() => bookings.filter((b) => b.status !== "cancelled"), [bookings]);

  const booked = useMemo(
    () =>
      active.map((b) => {
        const from = new Date(b.check_in + "T00:00:00");
        const to = new Date(b.check_out + "T00:00:00");
        to.setDate(to.getDate() - 1);
        return { from, to };
      }),
    [active],
  );
  const closed = useMemo(
    () => dateBlocks.filter((b) => b.status === "closed").map((b) => new Date(b.date + "T00:00:00")),
    [dateBlocks],
  );
  const reserved = useMemo(
    () => dateBlocks.filter((b) => b.status === "reserved").map((b) => new Date(b.date + "T00:00:00")),
    [dateBlocks],
  );

  const selected = range?.from ? toISODate(range.from) : "";
  const to = range?.to ? toISODate(range.to) : selected;

  // What occupies the clicked (start) date?
  const info = useMemo(() => {
    if (!selected) return null;
    const booking = active.find((b) => b.check_in <= selected && selected < b.check_out);
    if (booking) return { kind: "booked" as const, booking };
    const block = dateBlocks.find((b) => b.date === selected);
    if (block) return { kind: block.status, block };
    return { kind: "open" as const };
  }, [selected, active, dateBlocks]);

  return (
    <div className="space-y-4">
      <DayPicker
        mode="range"
        selected={range}
        onSelect={setRange}
        numberOfMonths={2}
        weekStartsOn={1}
        modifiers={{ booked, closed: [...closed, (d: Date) => isClosedDay(d)], reserved }}
        modifiersClassNames={{ booked: "rdp-booked", closed: "rdp-closed", reserved: "rdp-reserved" }}
      />

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend color="#b8862f" label="Booked (guest)" />
        <Legend color="#64748b" label="Closed" />
        <Legend color="#2563eb" label="Reserved" />
      </div>

      {/* Who's on the clicked date */}
      {info && (
        <div className="rounded-xl border p-4 text-sm">
          {info.kind === "booked" ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <User className="h-4 w-4" /> {info.booking.guest_name}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal capitalize text-muted-foreground">
                  {info.booking.status}
                </span>
              </div>
              <div className="text-muted-foreground">
                {info.booking.check_in} → {info.booking.check_out} · {info.booking.nights} night
                {info.booking.nights > 1 ? "s" : ""} · {info.booking.guests} guest
                {info.booking.guests > 1 ? "s" : ""}
              </div>
              <div className="text-muted-foreground">
                {info.booking.guest_email}
                {info.booking.guest_phone ? ` · ${info.booking.guest_phone}` : ""}
              </div>
              <div>
                <span className="font-medium">{formatCurrency(info.booking.total)}</span>
                <span className="text-muted-foreground"> · {info.booking.confirmation_code}</span>
                {info.booking.payment_proof_url && (
                  <>
                    {" · "}
                    <a href={info.booking.payment_proof_url} target="_blank" rel="noopener" className="text-brand underline">
                      view payment
                    </a>
                  </>
                )}
              </div>
            </div>
          ) : info.kind === "reserved" ? (
            <div>
              <span className="font-semibold text-blue-700">Reserved</span>
              {info.block.note ? <span className="text-muted-foreground"> — {info.block.note}</span> : <span className="text-muted-foreground"> (no note)</span>}
            </div>
          ) : info.kind === "closed" ? (
            <div>
              <span className="font-semibold text-slate-600">Closed</span>
              {info.block.note && <span className="text-muted-foreground"> — {info.block.note}</span>}
            </div>
          ) : (
            <span className="text-muted-foreground">{selected} is available.</span>
          )}
        </div>
      )}

      {/* Manage availability */}
      <form action={setDatesAction} className="rounded-xl border bg-muted/20 p-3">
        <input type="hidden" name="from" value={selected} />
        <input type="hidden" name="to" value={to} />
        <p className="text-sm">
          {selected ? (
            <>Selected: <span className="font-medium">{selected}{to !== selected ? ` → ${to}` : ""}</span></>
          ) : (
            <span className="text-muted-foreground">Pick a date or range above, then apply:</span>
          )}
        </p>
        <input
          name="note"
          placeholder="Reserved for / note (optional)"
          className="mt-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="submit" name="status" value="closed" disabled={!selected}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-40">
            <Lock className="h-3.5 w-3.5" /> Close
          </button>
          <button type="submit" name="status" value="reserved" disabled={!selected}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-40">
            <BookmarkCheck className="h-3.5 w-3.5" /> Reserve
          </button>
          <button type="submit" name="status" value="open" disabled={!selected}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-40">
            <CalendarCheck className="h-3.5 w-3.5" /> Open
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Click a date to see who&apos;s on it. “Reserve” can record a name in the note. Guest bookings are managed in the list below.
        </p>
      </form>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} /> {label}
    </span>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange, type Matcher } from "react-day-picker";
import "react-day-picker/style.css";
import { Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, toISODate } from "@/lib/utils";
import {
  quote,
  isClosedDay,
  MAX_GUESTS,
  CHECK_IN_TIME,
  CHECK_OUT_TIME,
  CURRENCY,
  RATE_TABLE,
} from "@/lib/pricing";

export function BookingWidget(props: {
  bookedRanges: { from: string; to: string }[]; // YYYY-MM-DD, [from, to)
  blockedDates: string[]; // YYYY-MM-DD individual dates the owner closed/reserved
  contactPhone: string;
}) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [hint, setHint] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Set of occupied/blocked night dates (YYYY-MM-DD).
  const blockedNights = useMemo(() => {
    const s = new Set<string>();
    for (const r of props.bookedRanges) {
      const end = new Date(r.to + "T00:00:00");
      for (const d = new Date(r.from + "T00:00:00"); d < end; d.setDate(d.getDate() + 1)) {
        s.add(toISODate(d));
      }
    }
    for (const d of props.blockedDates) s.add(d);
    return s;
  }, [props.bookedRanges, props.blockedDates]);

  // A night is unavailable if it's in the past, a Tuesday, or booked/blocked.
  const isUnavailable = useCallback(
    (d: Date) => d < today || isClosedDay(d) || blockedNights.has(toISODate(d)),
    [today, blockedNights],
  );

  const disabled = useMemo<Matcher[]>(() => [isUnavailable], [isUnavailable]);

  // Reject a range that spans any unavailable night, with a hint.
  function handleSelect(next: DateRange | undefined, triggerDate: Date) {
    if (next?.from && next?.to && next.to > next.from) {
      for (const d = new Date(next.from); d < next.to; d.setDate(d.getDate() + 1)) {
        if (isUnavailable(d)) {
          setHint("Those dates include an unavailable day. Please choose a range without blocked dates.");
          setRange(triggerDate ? { from: triggerDate, to: undefined } : undefined);
          return;
        }
      }
    }
    setHint(null);
    setRange(next);
  }

  const q = useMemo(() => {
    if (!range?.from || !range?.to) return null;
    return quote(toISODate(range.from), toISODate(range.to), guests);
  }, [range, guests]);

  const fromPrice = RATE_TABLE[0].weekday;

  function reserve() {
    if (!range?.from || !range?.to || !q || q.nights < 1) return;
    const params = new URLSearchParams({
      in: toISODate(range.from),
      out: toISODate(range.to),
      guests: String(guests),
    });
    router.push(`/book?${params.toString()}`);
  }

  return (
    <Card className="border-brand/20 shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm text-muted-foreground">from</span>
          <span className="font-display text-3xl font-semibold text-foreground">{formatCurrency(fromPrice, CURRENCY)}</span>
          <span className="text-sm text-muted-foreground">/ night</span>
        </div>

        <div className="mt-3 flex justify-center rounded-xl border bg-background p-2">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            disabled={disabled}
            numberOfMonths={1}
            weekStartsOn={1}
          />
        </div>

        {hint && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{hint}</p>
        )}

        <div className="mt-3 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium leading-none">Guests</div>
                <div className="mt-1 text-xs text-muted-foreground">{guests} of {MAX_GUESTS} max</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer guests"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                disabled={guests <= 1}
                className="grid h-9 w-9 place-items-center rounded-full border text-xl leading-none transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-input disabled:hover:text-foreground"
              >
                −
              </button>
              <span className="w-5 text-center text-base font-semibold tabular-nums">{guests}</span>
              <button
                type="button"
                aria-label="More guests"
                onClick={() => setGuests((g) => Math.min(MAX_GUESTS, g + 1))}
                disabled={guests >= MAX_GUESTS}
                className="grid h-9 w-9 place-items-center rounded-full border text-xl leading-none transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-input disabled:hover:text-foreground"
              >
                +
              </button>
            </div>
          </div>
          <p className="mt-3 border-t pt-2.5 text-xs text-muted-foreground">
            More than {MAX_GUESTS} guests? <a href={`tel:${props.contactPhone.replace(/\s/g, "")}`} className="font-medium text-brand hover:underline">Message us</a> — additional pax can be arranged.
          </p>
        </div>

        {q && q.nights > 0 && (
          <div className="mt-4 space-y-2 rounded-xl bg-muted/40 p-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{q.nights} night{q.nights > 1 ? "s" : ""} · {guests} guest{guests > 1 ? "s" : ""}</span>
              <span className="text-foreground">{formatCurrency(q.total, CURRENCY)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatCurrency(q.total, CURRENCY)}</span>
            </div>
          </div>
        )}

        <Button onClick={reserve} className="mt-4 w-full" disabled={!q || q.nights < 1}>
          {q && q.nights > 0 ? `Reserve · ${formatCurrency(q.total, CURRENCY)}` : "Select your dates"}
        </Button>

        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Check-in {CHECK_IN_TIME} · Check-out {CHECK_OUT_TIME}. Closed Tuesdays. Pay via GCash next — no booking fees.</span>
        </div>
      </CardContent>
    </Card>
  );
}

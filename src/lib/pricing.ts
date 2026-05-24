// Villa Yumi rates (₱). Pure module — safe to import on client and server.
// Source: official Villa Yumi rate card.
//
//            WEEKDAY   WEEKEND
//   1–4 pax   5,499     5,999
//   5–7 pax   6,499     6,999
//   8–10 pax  7,999     8,499
//
// Tuesdays are closed. Check-in 2 PM, check-out 10 AM next day.

export const CURRENCY = "PHP";
export const MAX_GUESTS = 10;
export const CHECK_IN_TIME = "2:00 PM";
export const CHECK_OUT_TIME = "10:00 AM the next day";

// 0=Sun, 1=Mon, 2=Tue ... 6=Sat
export const CLOSED_WEEKDAY = 2; // Tuesday

// Which days are billed at the WEEKEND rate. Edit here if the policy differs
// (e.g. drop 5/Friday if Friday should be a weekday rate).
export const WEEKEND_DAYS = [5, 6, 0]; // Fri, Sat, Sun

type Tier = { maxPax: number; weekday: number; weekend: number };
const TIERS: Tier[] = [
  { maxPax: 4, weekday: 5499, weekend: 5999 },
  { maxPax: 7, weekday: 6499, weekend: 6999 },
  { maxPax: 10, weekday: 7999, weekend: 8499 },
];

export const RATE_TABLE = TIERS.map((t) => ({
  label:
    t.maxPax === 4 ? "1–4 guests" : t.maxPax === 7 ? "5–7 guests" : "8–10 guests",
  weekday: t.weekday,
  weekend: t.weekend,
}));

export function isWeekend(d: Date): boolean {
  return WEEKEND_DAYS.includes(d.getDay());
}

export function isClosedDay(d: Date): boolean {
  return d.getDay() === CLOSED_WEEKDAY;
}

function tierFor(pax: number): Tier {
  return TIERS.find((t) => pax <= t.maxPax) ?? TIERS[TIERS.length - 1];
}

// Rate for a single night, based on that night's date + guest count.
export function nightlyRate(date: Date, pax: number): number {
  const t = tierFor(pax);
  return isWeekend(date) ? t.weekend : t.weekday;
}

export type Quote = {
  nights: number;
  total: number;
  hasClosedDay: boolean; // any night lands on a closed (Tuesday) day
};

// checkIn / checkOut are "YYYY-MM-DD" strings.
export function quote(checkIn: string, checkOut: string, pax: number): Quote {
  const ci = new Date(checkIn + "T00:00:00");
  const co = new Date(checkOut + "T00:00:00");
  let nights = 0;
  let total = 0;
  let hasClosedDay = false;
  for (const d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
    nights++;
    total += nightlyRate(d, pax);
    if (isClosedDay(d)) hasClosedDay = true;
  }
  return { nights, total, hasClosedDay };
}

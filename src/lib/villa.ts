import "server-only";
import { supabase } from "@/lib/supabase";

// ---- Static villa content (edit freely) ---------------------------------

export const VILLA = {
  name: "Villa Yumi",
  tagline: "Your ideal home away from home",
  description:
    "Experience the warmth and hospitality of Lucena City in a stylish villa with modern " +
    "amenities for a memorable stay. Whether for a weekend retreat or a longer vacation, " +
    "Villa Yumi is your ideal home away from home.",
  location: "Lucena City, Philippines",
  address:
    "Lot 5, Block 9, Netherland St., University Village Site, Ibabang Dupay, Lucena, Philippines, 4301",
  contactPhone: "0945 258 4049",
  contactEmail: "villayumi2024@gmail.com",
  maxGuests: 8,
  bathrooms: 2,
  // Shown in the quick-facts line under the gallery.
  sleeping: "Master bedroom (queen) · 2 bunk beds with pull-outs",
  // Categorized amenities (from the official Villa Yumi list).
  amenityGroups: [
    {
      title: "The space — fully air-conditioned",
      items: [
        "Master's bedroom with queen-size bed",
        "2 bunk beds with pull-outs",
        "2 bathrooms",
        '75" flat screen TV with home theater set',
        "Private pool with heater",
        "Free WiFi",
      ],
    },
    {
      title: "Kitchen",
      items: [
        "Oven",
        "Induction cooker",
        "Refrigerator",
        "Microwave",
        "Water dispenser",
        "Kettle",
        "Toaster",
        "Coffee filter machine / coffee station",
        "Nutricook",
        "Griller",
        "Cutlery, plates, and glasses",
        "Cookware set",
      ],
    },
    {
      title: "Bathroom",
      items: [
        "Towels and bathrobe",
        "Shower with hot & cold controls",
        "Shampoo and conditioner",
        "Body wash",
        "Toilet kit (toothpaste, toothbrush, soap, shampoo)",
        "Hand and body lotion",
        "Bidet",
        "Hamper",
      ],
    },
    {
      title: "Entertainment",
      items: ["PS4 Pro", "Board games", "Arcade", "Karaoke", "2 microphones"],
    },
    {
      title: "Safety",
      items: [
        "Smoke detector",
        "Fire extinguisher",
        "First aid kit",
        "Emergency light",
        "CCTV",
      ],
    },
    {
      title: "Additional features",
      items: ["Hair dryer", "Robot vacuum", "Doorbell"],
    },
  ],
  photos: [
    "/photos/p3.jpg", // pool + Villa Yumi sign (day) — hero
    "/photos/p4.jpg", // pool with deck chairs
    "/photos/p10.jpg", // pool at sunset
    "/photos/p6.jpg", // master bedroom (queen)
    "/photos/p11.jpg", // pool + arched entrance
    "/photos/p7.jpg", // bunk bed room
    "/photos/p2.jpg", // bathroom vanity
    "/photos/p1.jpg", // shower
    "/photos/p5.jpg", // games / decor nook
    "/photos/p8.jpg", // outdoor lounge chairs
  ],
  currency: "PHP",
  // Facebook reel/post to feature on the site.
  facebookUrl: "https://www.facebook.com/reel/2204335380385121",
} as const;

// ---- Settings (price + GCash details, editable from /admin) --------------

export type Settings = {
  nightly_price: number;
  cleaning_fee: number;
  gcash_name: string | null;
  gcash_number: string | null;
  gcash_qr_url: string | null;
};

const DEFAULT_SETTINGS: Settings = {
  nightly_price: 5000,
  cleaning_fee: 500,
  gcash_name: null,
  gcash_number: null,
  gcash_qr_url: null,
};

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("nightly_price, cleaning_fee, gcash_name, gcash_number, gcash_qr_url")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;
  return {
    nightly_price: Number(data.nightly_price),
    cleaning_fee: Number(data.cleaning_fee),
    gcash_name: data.gcash_name,
    gcash_number: data.gcash_number,
    gcash_qr_url: data.gcash_qr_url,
  };
}

// ---- Gallery (managed from /admin) ---------------------------------------

export type GalleryImage = { id: string; url: string };

// Admin-managed gallery. Falls back to the static VILLA.photos if the table
// is empty or unavailable, so the site is never photo-less.
export async function getGallery(): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from("gallery")
    .select("id, url, position")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return VILLA.photos.map((url, i) => ({ id: `static-${i}`, url }));
  }
  return data.map((g) => ({ id: g.id as string, url: g.url as string }));
}

// ---- Bookings ------------------------------------------------------------

export type Booking = {
  id: string;
  created_at: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in: string; // YYYY-MM-DD
  check_out: string;
  nights: number;
  guests: number;
  total: number;
  confirmation_code: string;
  gcash_reference: string | null;
  payment_proof_url: string | null;
  status: "pending" | "confirmed" | "cancelled";
};

// Date ranges that are taken (pending or confirmed) — used to block the
// calendar. Cancelled bookings free their dates back up.
export async function getBookedRanges(): Promise<{ from: string; to: string }[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("check_in, check_out")
    .in("status", ["pending", "confirmed"]);

  if (error || !data) return [];
  return data.map((b) => ({ from: b.check_in, to: b.check_out }));
}

export async function listBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((b) => ({ ...b, total: Number(b.total) })) as Booking[];
}

// True if [checkIn, checkOut) overlaps any pending/confirmed booking.
export async function hasOverlap(checkIn: string, checkOut: string): Promise<boolean> {
  // Overlap when existing.check_in < new.check_out AND existing.check_out > new.check_in
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .in("status", ["pending", "confirmed"])
    .lt("check_in", checkOut)
    .gt("check_out", checkIn)
    .limit(1);

  if (error) return false; // fail-open on read error; insert still proceeds
  return (data?.length ?? 0) > 0;
}

// ---- Manual availability blocks (set by the owner in /admin) -------------

export type DateBlock = { date: string; status: "closed" | "reserved"; note: string | null };

export async function getDateBlocks(): Promise<DateBlock[]> {
  const { data, error } = await supabase
    .from("date_blocks")
    .select("date, status, note")
    .order("date", { ascending: true });

  if (error || !data) return [];
  return data as DateBlock[];
}

// True if any night in [checkIn, checkOut) is manually blocked.
export async function hasBlockedDate(checkIn: string, checkOut: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("date_blocks")
    .select("date")
    .gte("date", checkIn)
    .lt("date", checkOut)
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

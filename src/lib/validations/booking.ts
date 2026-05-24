import { z } from "zod";

// A single villa — no unit/property ids. Dates are "YYYY-MM-DD" strings.
export const bookingSchema = z
  .object({
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-in date"),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-out date"),
    guests: z.coerce.number().int().min(1).max(20),
    guestName: z.string().min(2, "Please enter your name").max(100),
    guestEmail: z.string().email("Enter a valid email"),
    guestPhone: z.string().min(7, "Enter a contact number").max(30),
    gcashReference: z.string().min(4, "Enter your GCash reference number").max(64),
  })
  .refine((d) => d.checkOut > d.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export type BookingInput = z.infer<typeof bookingSchema>;

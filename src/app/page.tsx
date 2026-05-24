import { Check, MapPin, Users, BedDouble, Bath } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { BookingWidget } from "@/components/booking/booking-widget";
import { FacebookEmbed } from "@/components/marketing/facebook-embed";
import { VILLA, getBookedRanges, getGallery, getDateBlocks } from "@/lib/villa";

export const dynamic = "force-dynamic"; // always reflect latest availability

export default async function HomePage() {
  const [bookedRanges, gallery, dateBlocks] = await Promise.all([
    getBookedRanges(),
    getGallery(),
    getDateBlocks(),
  ]);
  const photos = gallery.map((g) => g.url);
  const blockedDates = dateBlocks.map((b) => b.date);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/60 via-background to-background" />
          <div className="container py-16 text-center md:py-24">
            <p className="flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-brand-dark animate-fade-up">
              <span className="h-px w-6 bg-brand/50" />
              Private Villa &amp; Pool
              <span className="h-px w-6 bg-brand/50" />
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight text-foreground md:text-7xl animate-fade-up">
              {VILLA.name}
            </h1>
            <p className="mt-3 font-display text-xl italic text-brand-dark md:text-2xl animate-fade-up">
              {VILLA.tagline}
            </p>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground animate-fade-up">
              <MapPin className="h-4 w-4 text-brand" /> {VILLA.location}
            </p>
          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="container">
          {/* Featured row: large hero + two stacked */}
          <div className="grid gap-3 md:grid-cols-4 md:grid-rows-2">
            <div
              className="group aspect-[4/3] overflow-hidden rounded-2xl bg-cover bg-center ring-1 ring-black/5 transition-transform duration-500 hover:scale-[1.01] md:col-span-2 md:row-span-2 md:aspect-auto"
              style={{ backgroundImage: `url(${photos[0]})` }}
            />
            {photos.slice(1, 5).map((src) => (
              <div
                key={src}
                className="aspect-[4/3] overflow-hidden rounded-2xl bg-cover bg-center ring-1 ring-black/5 transition-transform duration-500 hover:scale-[1.01]"
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
          {/* Remaining photos */}
          {photos.length > 5 && (
            <div className="mt-3 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {photos.slice(5).map((src) => (
                <div
                  key={src}
                  className="aspect-square overflow-hidden rounded-2xl bg-cover bg-center ring-1 ring-black/5 transition-transform duration-500 hover:scale-[1.02]"
                  style={{ backgroundImage: `url(${src})` }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Details + booking widget */}
        <section id="book" className="container grid gap-10 py-14 md:grid-cols-[1fr_380px]">
          <div id="about">
            <div className="flex flex-wrap gap-6 border-b pb-6 text-sm">
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-brand" /> Up to {VILLA.maxGuests} guests</span>
              <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-brand" /> {VILLA.sleeping}</span>
              <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-brand" /> {VILLA.bathrooms} baths</span>
            </div>

            <h2 className="mt-8 font-display text-3xl font-semibold">About the villa</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              {VILLA.description}
            </p>

            <h2 className="mt-10 font-display text-3xl font-semibold">What this place offers</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {VILLA.amenityGroups.map((group) => (
                <div key={group.title} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-dark">{group.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {group.items.map((a) => (
                      <li key={a} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="md:sticky md:top-20 md:self-start">
            <BookingWidget bookedRanges={bookedRanges} blockedDates={blockedDates} contactPhone={VILLA.contactPhone} />
          </div>
        </section>

        {VILLA.facebookUrl && <FacebookEmbed url={VILLA.facebookUrl} />}
      </main>
      <SiteFooter />
    </div>
  );
}

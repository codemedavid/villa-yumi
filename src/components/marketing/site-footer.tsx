import { VILLA } from "@/lib/villa";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-brand/30 bg-muted/40">
      <div className="container flex flex-col items-center gap-2 py-12 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt={VILLA.name} className="h-12 w-auto" />
        <p className="max-w-md text-sm text-muted-foreground">{VILLA.address}</p>
        <p className="text-sm text-muted-foreground">
          <a href={`tel:${VILLA.contactPhone.replace(/\s/g, "")}`} className="font-medium text-foreground hover:underline">{VILLA.contactPhone}</a>
          {" · "}
          <a href={`mailto:${VILLA.contactEmail}`} className="font-medium text-foreground hover:underline">{VILLA.contactEmail}</a>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {VILLA.name}. Book direct — no booking fees.
        </p>
      </div>
    </footer>
  );
}

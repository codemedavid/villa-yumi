import Link from "next/link";
import { VILLA } from "@/lib/villa";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt={VILLA.name} className="h-10 w-auto" />
          <span className="sr-only">{VILLA.name}</span>
        </Link>
        <nav className="hidden gap-8 text-sm font-medium uppercase tracking-wide md:flex">
          <Link href="/#gallery" className="text-muted-foreground transition-colors hover:text-brand-dark">Photos</Link>
          <Link href="/#about" className="text-muted-foreground transition-colors hover:text-brand-dark">About</Link>
          <Link href="/#book" className="text-muted-foreground transition-colors hover:text-brand-dark">Book</Link>
        </nav>
        <Link
          href="/#book"
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-dark"
        >
          Book now
        </Link>
      </div>
    </header>
  );
}

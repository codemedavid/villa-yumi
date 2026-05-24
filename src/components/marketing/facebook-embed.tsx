import { Facebook } from "lucide-react";

// Embeds a public Facebook video/reel via the official video plugin (a plain
// iframe — no SDK or login required). A direct link is shown alongside as a
// fallback in case the viewer's browser/extensions block the embed.
export function FacebookEmbed({ url }: { url: string }) {
  const src =
    "https://www.facebook.com/plugins/video.php?href=" +
    encodeURIComponent(url) +
    "&show_text=false&width=476&height=476";

  return (
    <section className="bg-muted/30 py-14">
      <div className="container flex flex-col items-center text-center">
        <h2 className="font-display text-3xl font-semibold">See Villa Yumi on Facebook</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A closer look at the villa.
        </p>

        <div className="mt-6 w-full max-w-[476px] overflow-hidden rounded-2xl border bg-background shadow-sm">
          <iframe
            src={src}
            title="Villa Yumi on Facebook"
            className="h-[476px] w-full"
            style={{ border: "none", overflow: "hidden" }}
            scrolling="no"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          />
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium hover:bg-accent"
        >
          <Facebook className="h-4 w-4" /> Watch on Facebook
        </a>
      </div>
    </section>
  );
}

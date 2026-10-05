"use client";

import { useState, type ReactNode } from "react";
import { Play } from "lucide-react";
import { stegaClean } from "next-sanity";
import { getHomeHeroVideoEmbedUrl } from "@/components/blocks/home-hero-video";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import about from "./maplewood-about.module.css";

/** A story photo that opens its YouTube video in a dialog (Webflow w-lightbox). */
export default function StoryVideoLightbox({
  children,
  label,
  url,
}: {
  children: ReactNode;
  label?: string | null;
  url: string;
}) {
  const [open, setOpen] = useState(false);
  const embedUrl = getHomeHeroVideoEmbedUrl(url);
  const name = stegaClean(label)?.trim() || "Play video";
  if (!embedUrl) return <>{children}</>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button aria-label={`Play video: ${name}`} className={about.videoButton} type="button">
          {children}
          <span aria-hidden="true" className={about.videoShade} />
          <span aria-hidden="true" className={about.videoLabel}>
            <Play fill="currentColor" size={56} />
            {label}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-0 bg-black p-0 shadow-2xl" showCloseButton>
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          {open ? (
            <iframe
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 size-full"
              src={embedUrl}
              title={name}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

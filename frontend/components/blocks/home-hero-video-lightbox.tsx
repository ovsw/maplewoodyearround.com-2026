"use client";

import { useState } from "react";
import { stegaClean } from "next-sanity";
import { Button } from "@/components/ui/button";
import { NavigationIcon } from "@/components/header/navigation-icon";
import { getHomeHeroVideoEmbedUrl } from "@/components/blocks/home-hero-video";
import type { ComponentProps } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function HomeHeroVideoLightbox({
  buttonKey,
  glass = false,
  icon,
  label,
  href,
  size = "hero",
  variant,
}: {
  buttonKey: string;
  /** Frosted backdrop for sitting on top of the hero photo. */
  glass?: boolean;
  icon?: { name?: string | null; svg?: string | null } | null;
  label: string;
  href: string;
  size?: NonNullable<ComponentProps<typeof Button>["size"]>;
  variant: NonNullable<ComponentProps<typeof Button>["variant"]>;
}) {
  const [open, setOpen] = useState(false);
  const embedUrl = getHomeHeroVideoEmbedUrl(href);
  const iconName = stegaClean(icon?.name)?.trim();
  const iconSvg = stegaClean(icon?.svg)?.trim();
  if (!embedUrl) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={
            glass ? "bg-fill-night/55 backdrop-blur-sm" : undefined
          }
          key={buttonKey}
          lift={false}
          variant={variant}
          size={size}
          onDark
        >
          {iconName && iconSvg ? (
            <NavigationIcon icon={{ name: iconName, svg: iconSvg }} />
          ) : null}
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-4xl border-0 bg-black p-0 shadow-2xl"
        showCloseButton
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          {open ? (
            <iframe
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 size-full"
              src={embedUrl}
              title={label}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

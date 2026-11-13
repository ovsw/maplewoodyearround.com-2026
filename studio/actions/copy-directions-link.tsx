import { LinkIcon } from "@sanity/icons/Link";
import { useToast } from "@sanity/ui";
import { useCallback } from "react";
import type { DocumentActionComponent } from "sanity";
import { directionsLink } from "./directions-link";

/**
 * "Copy directions link" on a Bus stop: puts the stop's Google Maps
 * directions link on the clipboard, for staff to paste into an email or a
 * text to a family. It reads the pin as it is in the form, draft included.
 */
export const copyDirectionsLinkAction: DocumentActionComponent = ({
  draft,
  published,
  onComplete,
}) => {
  const toast = useToast();
  const document = draft ?? published;
  const link = directionsLink(document?.location as Parameters<typeof directionsLink>[0]);

  const copy = useCallback(async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.push({
        status: "success",
        title: "Directions link copied",
        description: "Paste it into an email or a text to the family.",
      });
    } catch {
      toast.push({
        status: "error",
        title: "Could not copy the link",
        description: link,
        closable: true,
        duration: 30000,
      });
    } finally {
      onComplete();
    }
  }, [link, onComplete, toast]);

  return {
    label: "Copy directions link",
    icon: LinkIcon,
    disabled: !link,
    title: link ? "Copy a Google Maps directions link to this stop" : "Place the pin first",
    onHandle: copy,
  };
};

import { EarthGlobeIcon } from "@sanity/icons/EarthGlobe";
import { useCallback } from "react";
import {
  type DocumentFieldAction,
  type DocumentFieldActionProps,
  getPublishedId,
  useEditState,
} from "sanity";
import { useRouter } from "sanity/router";
import { getDocumentSlug, getPresentationPath } from "./routes";

export const openInPresentationAction: DocumentFieldAction = {
  name: "open-in-presentation",
  useAction: ({
    documentId,
    documentType,
    path,
  }: DocumentFieldActionProps) => {
    const document = useEditState(getPublishedId(documentId), documentType);
    const router = useRouter();
    const previewPath = getPresentationPath(
      documentType,
      getDocumentSlug(document?.draft, document?.published),
    );

    const handleOpen = useCallback(() => {
      if (!previewPath) return;

      router.navigateUrl({
        path: `/presentation?preview=${encodeURIComponent(previewPath)}`,
      });
    }, [previewPath, router]);

    return {
      type: "action",
      icon: EarthGlobeIcon,
      hidden: path.length > 0,
      disabled: !previewPath,
      renderAsButton: true,
      onAction: handleOpen,
      title: "Open in Presentation",
    };
  },
};

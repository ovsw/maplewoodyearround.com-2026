import type { PortableTextProps } from "@portabletext/react";
import { CustomLinkMarkRenderer } from "@/components/portable-text/custom-link-mark";

/**
 * Serializers for the `simpleRichText` schema: paragraphs with bold, italic,
 * and inline links, nothing else. The shared PortableTextRenderer carries
 * inline margins and serializers for blocks this field cannot contain, so
 * sections space the paragraphs themselves (e.g. `grid gap-(--space-stack)`
 * on the wrapper).
 */
export const simpleRichTextComponents: PortableTextProps["components"] = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
  },
  marks: {
    customLink: CustomLinkMarkRenderer,
  },
};

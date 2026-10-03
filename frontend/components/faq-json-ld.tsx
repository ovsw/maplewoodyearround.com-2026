import {
  createFaqPageJsonLd,
  serializeFaqPageJsonLd,
  type FaqJsonLdBlock,
} from "@/lib/faq-json-ld";

export default function FaqPageJsonLd({
  blocks,
}: {
  blocks: readonly FaqJsonLdBlock[];
}) {
  const value = createFaqPageJsonLd(blocks);
  if (!value) return null;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeFaqPageJsonLd(value) }}
      type="application/ld+json"
    />
  );
}

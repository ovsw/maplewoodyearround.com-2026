import {
  createVideoObjectJsonLd,
  serializeVideoObjectJsonLd,
} from "@/lib/video-json-ld";

export default function VideoJsonLd({ content }: { content: unknown }) {
  const values = createVideoObjectJsonLd(content);

  return values.map((value, index) => (
    <script
      // Video blocks do not have a guaranteed stable key across all Portable Text shapes.
      key={`${value.name}-${index}`}
      dangerouslySetInnerHTML={{ __html: serializeVideoObjectJsonLd(value) }}
      type="application/ld+json"
    />
  ));
}
